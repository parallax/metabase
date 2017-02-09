(ns metabase.api.embed
  "Various endpoints that use [JSON web tokens](https://jwt.io/introduction/) to fetch Cards and Dashboards.
   The endpoints are the same as the ones in `api/public/`, and differ only in the way they are authorized.

   To use these endpoints:

    1.  Set the `embedding-secret-key` Setting to a hexadecimal-encoded 32-byte sequence (i.e., a 64-character string).
        You can use `/api/util/random_token` to get a cryptographically-secure value for this.
    2.  Sign/base-64 encode a JSON Web Token using the secret key and pass it as the relevant part of the URL path
        to the various endpoints here.

   Tokens can have the following fields:

      {:resource {:question  <card-id>
                  :dashboard <dashboard-id>}
       :params   <params>}"
  ;; TODO - switch resource.question back to resource.card
  (:require [clojure.tools.logging :as log]
            [buddy.sign.jwt :as jwt]
            [compojure.core :refer [GET]]
            [toucan.db :as db]
            (metabase.api [common :as api]
                          [dataset :as dataset-api]
                          [public :as public-api])
            (metabase.models [card :refer [Card]]
                             [dashboard :refer [Dashboard]]
                             [dashboard-card :refer [DashboardCard]])
            [metabase.models.setting :as setting]
            [metabase.util :as u]))


;;; ------------------------------------------------------------ Setting & Util Fns ------------------------------------------------------------

(setting/defsetting ^:private embedding-secret-key
  "Secret key used to sign JSON Web Tokens for requests to `/api/embed` endpoints."
  :setter (fn [new-value]
            (when (seq new-value)
              (assert (re-matches #"[0-9a-f]{64}" new-value)
                "Invalid embedding-secret-key! Secret key must be a hexadecimal-encoded 256-bit key (i.e., a 64-character string)."))
            (setting/set-string! :embedding-secret-key new-value)))


(defn- unsign [^String message]
  (when (seq message)
    (jwt/unsign message (or (embedding-secret-key)
                            (throw (ex-info "The embedding secret key has not been set." {:status-code 400}))))))

(defn- get-in-unsigned-token-or-throw [unsigned-token keyseq]
  (or (get-in unsigned-token keyseq)
      (throw (ex-info (str "Token is missing value for keypath" keyseq) {:status-code 400}))))

(defn- check-embedding-enabled [object]
  (api/check-404 object)
  (api/check (:enable_embedding object)
    [400 "Embedding is not enabled for this object."]))

(defn- check-embedding-enabled-for-dashboard [dashboard-id]
  (check-embedding-enabled (db/select-one [Dashboard :enable_embedding] :id dashboard-id)))

(defn- check-embedding-enabled-for-card [card-id]
  (check-embedding-enabled (db/select-one [Card :enable_embedding] :id card-id)))


;;; ------------------------------------------------------------ Param Util Fns ------------------------------------------------------------


(defn- remove-token-parameters
  "Removes any parameters with slugs matching keys provided in token-params, as these should not be exposed to the user."
  [dashboard-or-card token-params]
  (update dashboard-or-card :parameters (partial remove (comp (partial contains? token-params) keyword :slug)))) ; grab :slug, convert to kw, remove if in token-params

(defn- template-tag-parameters
  "Transforms native query's `template_tags` into `parameters`."
  [card]
  ;; NOTE: this should mirror `getTemplateTagParameters` in frontend/src/metabase/meta/Parameter.js
  (for [[_ {tag-type :type, :as tag}] (get-in card [:dataset_query :native :template_tags])
        :when                         (and tag-type
                                           (not= tag-type "dimension"))]
    {:id      (:id tag)
     :type    (if (= tag-type "date") "date/single" "category")
     :target  ["variable" ["template-tag" (:name tag)]]
     :name    (:display_name tag)
     :slug    (:name tag)
     :default (:default tag)}))


(defn- add-implicit-card-parameters
  [card]
  (update card :parameters concat (template-tag-parameters card)))


(defn- apply-parameter-values
  "Adds `value` to parameters with `slug` matching a key in `parameter-values` and removes parameters without a `value`"
  [parameters parameter-values]
  (for [param parameters
        :let  [value (get parameter-values (keyword (:slug param)))]
        :when (not (nil? value))]
    (assoc (select-keys param [:type :target])
      :value value)))


(defn- resolve-card-parameters
  "Returns parameters for a card" ; TODO - better docstring
  [card-or-id]
  (-> (db/select-one [Card :dataset_query], :id (u/get-id card-or-id))
      add-implicit-card-parameters
      :parameters))


(defn- resolve-dashboard-parameters
  "Returns parameters for a card on a dashboard with :target resolved via :parameter_mappings"
  [dashboard-id dashcard-id card-id]
  ;; FIXME: validate the card is actually in the dashcard which is actually in the dashboard otherwise
  ;; an attacker could bypass a required a parameter!
  (let [parameters (u/key-by :id (db/select-one-field :parameters Dashboard :id dashboard-id))]
    (->> (db/select-one-field :parameter_mappings DashboardCard :id dashcard-id)
         (filter #(= card-id (:card_id %)))
         (map #(assoc (get parameters (:parameter_id %)) :target (:target %)))
         (remove nil?))))


;;; ------------------------------------------------------------ Cards ------------------------------------------------------------

(api/defendpoint GET "/card/:token"
  "Fetch a Card via a JSON Web Token signed with the `embedding-secret-key`.

   Token should have the following format:

     {:resource {:question <card-id>}}"
  [token]
  (let [unsigned-token (unsign token)
        id             (get-in-unsigned-token-or-throw unsigned-token [:resource :question])
        token-params   (get-in-unsigned-token-or-throw unsigned-token [:params])]
    (-> (public-api/public-card :id id, :enable_embedding true)
        add-implicit-card-parameters
        (remove-token-parameters token-params))))


(defn- run-query-for-unsigned-token [unsigned-token query-params & options]
  (let [card-id          (get-in-unsigned-token-or-throw unsigned-token [:resource :question])
        token-params     (get-in-unsigned-token-or-throw unsigned-token [:params])
        ;; TODO: validate required signed parameters are present in token-params (once that is configurable by the admin)
        parameter-values (merge query-params token-params)
        parameters       (apply-parameter-values (resolve-card-parameters card-id) parameter-values)]
    (check-embedding-enabled-for-card card-id)
    (apply public-api/run-query-for-card-with-id card-id parameters options)))


(api/defendpoint GET "/card/:token/query"
  "Fetch the results of running a Card using a JSON Web Token signed with the `embedding-secret-key`.

   Token should have the following format:

     {:resource {:question <card-id>}
      :params   <parameters>}"
  [token & query-params]
  (run-query-for-unsigned-token (unsign token) query-params))


(api/defendpoint GET "/card/:token/query/csv"
  "Like `GET /api/embed/card/query`, but returns the results as CSV."
  [token & query-params]
  (dataset-api/as-csv (run-query-for-unsigned-token (unsign token) query-params, :constraints nil)))


(api/defendpoint GET "/card/:token/query/json"
  "Like `GET /api/embed/card/query`, but returns the results as JSOn."
  [token & query-params]
  (dataset-api/as-json (run-query-for-unsigned-token (unsign token) query-params, :constraints nil)))


;;; ------------------------------------------------------------ Dashboards ------------------------------------------------------------

(api/defendpoint GET "/dashboard/:token"
  "Fetch a Dashboard via a JSON Web Token signed with the `embedding-secret-key`.

   Token should have the following format:

     {:resource {:dashboard <dashboard-id>}}"
  [token]
  (let [unsigned     (unsign token)
        id           (get-in-unsigned-token-or-throw unsigned [:resource :dashboard])
        token-params (get-in-unsigned-token-or-throw unsigned [:params])]
    (-> (public-api/public-dashboard :id id, :enable_embedding true)
        (remove-token-parameters token-params))))


(api/defendpoint GET "/dashboard/:token/dashcard/:dashcard-id/card/:card-id"
  "Fetch the results of running a Card belonging to a Dashboard using a JSON Web Token signed with the `embedding-secret-key`.

   Token should have the following format:

     {:resource {:dashboard <dashboard-id>}
      :params   <parameters>}

   Additional dashboard parameters can be provided in the query string, but params in the JWT token take precedence."
  [token dashcard-id card-id & query-params]
  (let [unsigned-token   (unsign token)
        dashboard-id     (get-in-unsigned-token-or-throw unsigned-token [:resource :dashboard])
        token-params     (get-in-unsigned-token-or-throw unsigned-token [:params])
        ;; TODO: validate required signed parameters are present in token-params (once that is configurable by the admin)
        parameter-values (merge query-params token-params)
        parameters       (apply-parameter-values (resolve-dashboard-parameters dashboard-id dashcard-id card-id) parameter-values)]
    (check-embedding-enabled-for-dashboard dashboard-id)
    (public-api/public-dashcard-results dashboard-id card-id parameters)))


(api/define-routes)
