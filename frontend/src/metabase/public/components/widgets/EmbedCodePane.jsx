/* @flow */

import React, { Component, PropTypes } from "react";

import ExternalLink from "metabase/components/ExternalLink";
import CodeSample from "./CodeSample";

import { getPublicEmbedOptions, getSignedEmbedOptions, getSignTokenOptions } from "../../lib/code"

import "metabase/lib/ace/theme-metabase";

import "ace/mode-javascript";
import "ace/mode-ruby";
import "ace/mode-html";
import "ace/mode-jsx";

const ViewOnJWTIO = ({ className, token }) =>
    <ExternalLink className={className} href={`https://jwt.io/#id_token=${token}`}>
        <img src="https://jwt.io/assets/badge.svg" width={75} />
    </ExternalLink>

const EmbedCodePane = ({ className, secure, iframeUrl, token, siteUrl, secretKey, resourceType, resourceId, params }) =>
    <div className={className}>
        { secure ?
            <div key="secure">
                <CodeSample
                    title="Server-side Token Signing"
                    options={getSignTokenOptions({ siteUrl, secretKey, resourceType, resourceId, params })}
                />
                <div className="mt1 flex align-center">
                    <ViewOnJWTIO className="ml-auto" token={token} />
                </div>
                <CodeSample
                    title="Embed Code"
                    options={getSignedEmbedOptions({ iframeUrl })}
                />
            </div>
        :
            <div key="public">
                <CodeSample
                    title="Embed Code"
                    options={getPublicEmbedOptions({ iframeUrl })}
                />
            </div>
        }

        <div className="text-centered my2">
            <h4>More <ExternalLink href="https://github.com/metabase/metabase">examples on GitHub</ExternalLink></h4>
        </div>
    </div>

export default EmbedCodePane;
