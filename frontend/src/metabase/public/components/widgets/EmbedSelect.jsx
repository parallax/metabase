/* @flow */

import React, { Component, PropTypes } from "react";

import cx from "classnames";

const EmbedSelect = ({ className, value, onChange, options }) =>
    <div className={cx(className, "flex")}>
        { options.map(option =>
            <div
                className={cx("flex-full flex layout-centered mx1 p1 border-bottom border-med", {
                    "border-dark": value === option.value,
                    "cursor-pointer": value !== option.value
                })}
                onClick={() => onChange(option.value)}
            >
                {option.name}
            </div>
        )}
        {/* hack because border-bottom doesn't add a border to the last element :-/ */}
        <div className="hide" />
    </div>

export default EmbedSelect;
