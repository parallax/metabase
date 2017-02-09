(ns metabase.util.encryption-test
  (:require [expectations :refer :all]
            [metabase.util.encryption :as encryption]))

;; test that hashing a secret key twice gives you the same results
(expect
  (= (vec (encryption/secret-key->hash "Toucans"))
     (vec (encryption/secret-key->hash "Toucans"))))

(def ^:private secret (encryption/secret-key->hash "Orw0AAyzkO/kPTLJRxiyKoBHXa/d6ZcO+p+gpZO/wSQ="))

;; test that we can encrypt a message. Should be base-64
(expect
  #"^[0-9A-Za-z/+]+=*$"
  (encryption/encrypt secret "Hello!"))

;; test that encrypting something twice gives you two different ciphertexts
(expect
  (not= (encryption/encrypt secret "Hello!")
        (encryption/encrypt secret "Hello!")))

;; test that we can decrypt something
(expect
  "Hello!"
  (encryption/decrypt secret (encryption/encrypt secret "Hello!")))
