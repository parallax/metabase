(ns metabase.util.encryption
  "Utility functions for encrypting and decrypting strings using AES256 CBC + HMAC SHA512 and the `MB_ENCRYPTION_SECRET_KEY` env var."
  (:require (buddy.core [codecs :as codecs]
                        [crypto :as crypto]
                        [hash :as hash]
                        [nonce :as nonce])
            [clojure.tools.logging :as log]
            [environ.core :as env]
            [metabase.util :as u]))

(defonce ^:private secret-key
  (when-let [secret-key (env/env :mb-encryption-secret-key)]
    (when (seq secret-key)
      (hash/sha512 secret-key))))

;; log a nice message letting people know whether DB details encryption is enabled
(log/info (format "DB details encryption is %s for this Metabase instance. %s"
                  (if secret-key "ENABLED" "DISABLED")
                  (u/emoji (if secret-key "🔐" "🔓"))))

(defn encrypt
  "Encrypt string S as hex bytes using the `MB_ENCRYPTION_SECRET_KEY`."
  ^String [^String s]
  (let [iv (nonce/random-bytes 16)]
    (str (codecs/bytes->hex iv)
         (codecs/bytes->hex (crypto/encrypt (codecs/to-bytes s) secret-key iv {:algorithm :aes256-cbc-hmac-sha512})))))

(defn decrypt
  "Decrypt string S  using the `MB_ENCRYPTION_SECRET_KEY`."
  ^String [^String s]
  (let [bytes        (codecs/hex->bytes s)
        [iv message] (split-at 16 bytes)]
    (codecs/bytes->str (crypto/decrypt (byte-array message) secret-key (byte-array iv) {:algorithm :aes256-cbc-hmac-sha512}))))

(defn maybe-encrypt
  "If `MB_ENCRYPTION_SECRET_KEY` is set, return an encrypted version of S; otherwise return S as-is."
  ^String [^String s]
  (if secret-key
    (when (seq s)
      (encrypt s))
    s))

(defn maybe-decrypt
  "If `MB_ENCRYPTION_SECRET_KEY` is set and S is encrypted, decrypt S; otherwise return S as-is."
  ^String [^String s]
  (if secret-key
    (when (seq s)
      (try (decrypt s)
           ;; if for some reason we we're able to decrypt S it's probably because it wasn't encrypted in the first place, just return as-is
           (catch Throwable _
             s)))
    s))
