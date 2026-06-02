import React, {memo, NamedExoticComponent} from "react";
import Input from "@jetbrains/ring-ui-built/components/input/input";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import ButtonSet from "@jetbrains/ring-ui-built/components/button-set/button-set";

import {getMessages} from "./i18n";
import {WidgetConfiguration} from "./types";

interface Props {
  onDone: (config?: WidgetConfiguration) => void;
  initialConfig?: WidgetConfiguration | null;
}

const ConfigurationComponent: React.FunctionComponent<Props> = ({onDone, initialConfig}) => {
  const t = getMessages();
  const [value, setValue] = React.useState<string>(initialConfig?.title || "");

  const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value);
  }, []);

  const onSubmit = React.useCallback((): void => {
    onDone({title: value});
  }, [onDone, value]);

  const onCancel = React.useCallback((): void => {
    onDone(initialConfig ?? undefined);
  }, [onDone, initialConfig]);

  return (
    <form className="ring-form">
      <span className="ring-form__title">{t.configTitle}</span>
      <Input label={t.configTitleLabel} value={value} onChange={onChange}/>
      <ButtonSet className="config-buttons">
        <Button primary onClick={onSubmit}>{t.configSave}</Button>
        <Button secondary onClick={onCancel}>{t.configCancel}</Button>
      </ButtonSet>
    </form>
  );
};

export const Configuration: NamedExoticComponent<Props> = memo(ConfigurationComponent);
