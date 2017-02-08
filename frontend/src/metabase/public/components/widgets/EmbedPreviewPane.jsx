
import React, { Component, PropTypes } from "react";

import cx from "classnames";

const EmbedPreviewPane = ({ className, previewUrl }) =>
    <div className={cx(className, "flex")}>
        <iframe
            className="flex-full"
            src={previewUrl}
            frameBorder={0}
            allowTransparency
        />
    </div>

export default EmbedPreviewPane;
