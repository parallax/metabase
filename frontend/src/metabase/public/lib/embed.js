
import KJUR from "jsrsasign";
import querystring from "querystring";

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

export function getSignedPreviewUrl(siteUrl, resourceType, resourceId, params = {}, options, secretKey) {
    const token = getSignedToken(resourceType, resourceId, params, secretKey);
    return `${siteUrl}/embed/${resourceType}/${token}${optionsToHashParams(options)}`;
}

export function getUnsignedPreviewUrl(siteUrl, resourceType, resourceId, options) {
    return `${siteUrl}/public/${resourceType}/${resourceId}${optionsToHashParams(options)}`
}

export function optionsToHashParams(options = {}) {
    options = { ...options };
    // filter out null, undefined, ""
    for (var name in options) {
        if (options[name] == null || options[name] === "") {
            delete options[name];
        }
    }
    const query = querystring.stringify(options);
    return query ? `#${query}` : ``
}
