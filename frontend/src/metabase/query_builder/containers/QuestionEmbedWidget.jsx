/* @flow */
import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";

import EmbedWidget from "metabase/public/components/widgets/EmbedWidget";

import { createPublicLink, deletePublicLink } from "../actions";

const mapDispatchToProps = {
    createPublicLink,
    deletePublicLink
}

@connect(null, mapDispatchToProps)
export default class QuestionEmbedWidget extends Component {
    render() {
        const { className, card, createPublicLink, deletePublicLink, ...props } = this.props;
        return (
            <EmbedWidget
                {...props}
                className={className}
                card={card}
                type="question"
                uuid={card.public_uuid}
                onCreate={() => createPublicLink(card)}
                onDisable={() => deletePublicLink(card)}
            />
        );
    }
}
