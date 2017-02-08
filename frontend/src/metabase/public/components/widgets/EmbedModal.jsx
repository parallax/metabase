/* @flow */

import React, { Component, PropTypes } from "react";

import EmbedSettingsPane from "./EmbedSettingsPane";
import EmbedPreviewPane from "./EmbedPreviewPane";
import EmbedCodePane from "./EmbedCodePane";

import ToggleLarge from "metabase/components/ToggleLarge";

import { getSignedPreviewUrl, getUnsignedPreviewUrl, getSignedToken } from "../../lib/embed";

type Props = {
};

type State = {
};

// FIXME:
const siteUrl = "http://localhost:3000";
const secretKey = "da1be1ab5f380fc1c1a0300509185795add503ef05186d9364a38d5a8b03e36d"

import cx from "classnames";

export default class EmbedModal extends Component<*, Props, State> {
    state: State;

    constructor(props: Props) {
        super(props);
        this.state = {
            pane: "preview",
            secure: false,
            parameters: {}
        };
    }

    static defaultProps = {};

    render() {
        const { card, type } = this.props;
        const { pane, secure, parameters } = this.state;

        let iframeUrl;
        if (secure) {
            iframeUrl = getSignedPreviewUrl(siteUrl, type, card.id, {}, secretKey);
        } else {
            iframeUrl = getUnsignedPreviewUrl(siteUrl, type, card.public_uuid);
        }
        const token = getSignedToken(type, card.id, {}, secretKey);

        return (
            <div
                className={cx("spread flex p4", { "bg-brand": pane === "preview" })}
                style={{ transition: "background-color 300ms linear" }}
            >
                <div className={"flex-full mr4 flex flex-column"}>
                    <ToggleLarge
                        className="mb2"
                        style={{ width: 244, height: 34 }}
                        value={pane === "preview"}
                        textLeft="Preview"
                        textRight="Code"
                        onChange={(e) => this.setState({ pane: pane === "preview" ? "code" : "preview" })}
                    />
                    { pane === "preview" ?
                        <EmbedPreviewPane
                            className="flex-full"
                            previewUrl={iframeUrl}
                        />
                    : pane === "code" ?
                        <EmbedCodePane
                            secure={secure}
                            iframeUrl={iframeUrl}
                            token={token}
                            siteUrl={siteUrl}
                            secretKey={secretKey}
                            resourceType={type}
                            resourceId={card.id}
                            params={{}}
                        />
                    : null }
                </div>
                <EmbedSettingsPane
                    card={card}
                    secure={secure}
                    onChangeSecure={(secure) => this.setState({ secure })}
                    parameters={parameters}
                    onChangeParameters={(parameters) => this.setState({ parameters })}
                />
            </div>
        );
    }
}
