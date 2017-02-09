
import React, { Component, PropTypes } from "react";

import cx from "classnames";

export default class EmbedPreviewPane extends Component {
    constructor(props) {
        super(props);

        // stupid hack to prevent mounting iframe from killing animation performance
        this.state = {
            loading: true
        };
        setTimeout(() => this.setState({ loading: false }), 300);
    }
    render() {
        const { className, previewUrl } = this.props;
        const { loading } = this.state;
        return (
            <div className={cx(className, "flex")}>
                <iframe
                    className="flex-full"
                    src={loading ? null : previewUrl}
                    frameBorder={0}
                    allowTransparency
                />
            </div>
        );
    }
}
