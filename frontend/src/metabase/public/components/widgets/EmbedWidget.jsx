/* @flow */

import React, { Component, PropTypes } from "react";

import ModalWithTrigger from "metabase/components/ModalWithTrigger";
import Tooltip from "metabase/components/Tooltip";
import Icon from "metabase/components/Icon";

import EmbedModal from "./EmbedModal";

import cx from "classnames";

type Props = {
};

type State = {
};

export default class EmbedWidget extends Component<*, Props> {
    props: Props;

    render() {
        const { className, type } = this.props;
        return (
            <ModalWithTrigger
                ref={m => this._modal = m}
                full
                triggerElement={
                    <Tooltip tooltip={`Embed this ${type}`}>
                        <Icon name="share" />
                    </Tooltip>
                }
                triggerClasses={cx(className, "text-brand-hover")}
                className="scroll-y"
            >
                <EmbedModal
                    {...this.props}
                    onClose={() => this._modal.close()}
                    className="full-height"
                />
            </ModalWithTrigger>
        );
    }
}
