/* @flow */

import React, { Component, PropTypes } from "react";

import Select, { Option } from "metabase/components/Select";
import CopyButton from "metabase/components/CopyButton";

import AceEditor from "metabase/components/TextEditor";

import _ from "underscore";

export default class CodeSample extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.options[0].name
        };
    }
    render() {
        const { title, options } = this.props;
        const { name } = this.state;
        const selected = _.findWhere(options, { name });
        const source = selected && selected.source()
        return (
            <div>
                <div className="mt2 flex align-center">
                    <h4>{title}</h4>
                    { options && options.length > 0 ?
                        <Select
                            className="AdminSelect--borderless ml-auto"
                            value={name}
                            onChange={(e) => this.setState({ name: e.target.value })}
                        >
                            { options.map(option =>
                                <Option value={option.name}>{option.name}</Option>
                            )}
                        </Select>
                    : null }
                </div>
                <div className="bordered rounded relative">
                    <AceEditor
                        className="z1"
                        value={source}
                        mode={selected && selected.mode}
                        theme="ace/theme/metabase"
                        sizeToFit readOnly
                    />
                    { source &&
                        <div className="absolute top right text-brand-hover cursor-pointer z2">
                            <CopyButton className="p1" value={source} />
                        </div>
                    }
                </div>
            </div>
        )
    }
}
