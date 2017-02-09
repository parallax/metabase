import React from "react";

import Toggle from "metabase/components/Toggle";
import Icon from "metabase/components/Icon";
import Button from "metabase/components/Button";
import Select, { Option } from "metabase/components/Select";

import EmbedSelect from "./EmbedSelect";

import cx from "classnames";

import { getParameters } from "metabase/meta/Card";

const THEME_OPTIONS = [
    { name: "Light", value: null },
    { name: "Dark", value: "night" }
];

const BORDER_OPTIONS = [
    { name: "Bordered", value: true },
    { name: "No border", value: false }
];

const getIconForParameter = (parameter) =>
    parameter.type === "category" ? "string" :
    parameter.type.indexOf("date/") === 0 ? "calendar" :
    "unknown";

const EmbedSettingsPane = ({ className, card, secure, onChangeSecure, parameters, onChangeParameters, displayOptions, onChangeDisplayOptions }) =>
    <div className={cx(className, "rounded bordered p2 flex flex-column bg-white")} style={{ width: 320 }}>
        <Section title="Security">
            <p>Require cryptographic signing for this embed</p>
            <Toggle value={secure} onChange={onChangeSecure} />
        </Section>
        <Section title="Style">
            <EmbedSelect
                value={displayOptions.theme}
                options={THEME_OPTIONS}
                onChange={(value) => onChangeDisplayOptions({ ...displayOptions, theme: value })}
            />
            <EmbedSelect
                value={displayOptions.bordered}
                options={BORDER_OPTIONS}
                onChange={(value) => onChangeDisplayOptions({ ...displayOptions, bordered: value })}
            />
        </Section>
        { secure &&
            <Section title="Parameters">
                <p>Which parameters can users of this embed use?</p>
                {getParameters(card).map(parameter =>
                    <div className="flex align-center my1">
                        <Icon name={getIconForParameter(parameter)} className="mr2" style={{ color: "#DFE8EA" }} />
                        <h3>{parameter.name}</h3>
                        <Select
                            className="ml-auto"
                            value={parameters[parameter.id]}
                            onChange={(e) => onChangeParameters({ ...parameters, [parameter.id] : e.target.value })}
                        >
                            <Option icon="close" value={null}>Disabled</Option>
                            <Option icon="pencil" value="editable">Editable</Option>
                            <Option icon="lock" value="locked">Locked</Option>
                        </Select>
                    </div>
                )}
            </Section>
        }
        <div className="ml-auto">
            <Button primary>Update Settings</Button>
        </div>
    </div>

const Section = ({ title, children }) =>
    <div className="mb4">
        <h3>{title}</h3>
        {children}
    </div>

export default EmbedSettingsPane;
