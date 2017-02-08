
import KJUR from "jsrsasign";

export function getSignedToken(resourceType, resourceId, params = {}, secretKey) {
    // using jsrsasign because jsonwebtoken doesn't work on the web :-/
    return KJUR.jws.JWS.sign(null, {
        alg: "HS256",
        typ: "JWT"
    }, {
        resource: { [resourceType]: resourceId },
        params: params,
        iat: Math.round(new Date().getTime() / 1000)
    }, { utf8: secretKey });
}

export function getSignedPreviewUrl(siteUrl, resourceType, resourceId, params = {}, secretKey) {
    const token = getSignedToken(resourceType, resourceId, params, secretKey);
    return `${siteUrl}/embed/${resourceType}/${token}`;
}

export function getUnsignedPreviewUrl(siteUrl, resourceType, resourceId) {
    return `${siteUrl}/public/${resourceType}/${resourceId}`
}
