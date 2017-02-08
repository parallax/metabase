
export const getPublicEmbedOptions = ({ iframeUrl }) => [
    { name: "HTML",    source: () => html({ iframeUrl: `"${iframeUrl}"` }), mode: "ace/mode/html" },
    { name: "JSX",     source: () =>  jsx({ iframeUrl: `"${iframeUrl}"` }), mode: "ace/mode/jsx" },
];

export const getSignedEmbedOptions = () => [
    { name: "HTML (Mustache)", source: () => html({ iframeUrl: `"{{iframeUrl}}"`, mode: "ace/mode/html" })},
    { name: "JSX",             source: () =>  jsx({ iframeUrl: `{iframeUrl}`,     mode: "ace/mode/jsx" })},
];

export const getSignTokenOptions = (params) => [
    { name: "Node.js", source: () => node(params), mode: "ace/mode/javascript" },
    { name: "Ruby",    source: () => ruby(params), mode: "ace/mode/ruby" },
];

const html = ({ iframeUrl }) =>
`<iframe
    src=${iframeUrl}
    frameborder="0"
    allowtransparency
/>`

const jsx = ({ iframeUrl }) =>
`<iframe
    src=${iframeUrl}
    frameBorder={0}
    allowTransparency
/>`

const node = ({ siteUrl, secretKey, resourceType, resourceId, params }) =>
`var jwt = require("jsonwebtoken");

var METABASE_SITE_URL = ${JSON.stringify(siteUrl)};
var METABASE_SECRET_KEY = ${JSON.stringify(secretKey)};

var payload = {
  resource: { ${resourceType}: ${resourceId} },
  params: ${JSON.stringify(params, null, 2).split("\n").join("\n  ")}
};
var token = jwt.sign(payload, METABASE_SECRET_KEY);

var iframeUrl = METABASE_SITE_URL + "/embed/${resourceType}/" + token;`;

const ruby = ({ siteUrl, secretKey, resourceType, resourceId, params }) =>
`require 'jwt'

METABASE_SITE_URL = ${JSON.stringify(siteUrl)}
METABASE_SECRET_KEY = ${JSON.stringify(secretKey)}

payload = {
  :resource => {:${resourceType} => ${resourceId}},
  :params => {
    ${Object.entries(params).map(([key,value]) => JSON.stringify(key) + " => " + JSON.stringify(value)).join(",\n    ")}
  }
}
token = JWT.encode payload, METABASE_SECRET_KEY

iframeUrl = METABASE_SITE_URL + "/embed/${resourceType}/" + token
`;
