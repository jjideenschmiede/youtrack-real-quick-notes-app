import React, {memo, MutableRefObject, NamedExoticComponent, useCallback, useEffect, useRef, useState} from "react";

import type {EmbeddableWidgetAPI} from "../../../@types/globals";

import {Configuration} from "./configuration";
import {getMessages} from "./i18n";
import {SaveStatus, WidgetCache, WidgetConfiguration} from "./types";

type Props = object

const SAVE_DEBOUNCE_MS = 500;
const SAVED_INDICATOR_MS = 1500;

const AppComponent: React.FunctionComponent<Props> = () => {
  const t = getMessages();
  const hostRef: MutableRefObject<EmbeddableWidgetAPI | null> = useRef<EmbeddableWidgetAPI | null>(null);
  const hydratedRef: MutableRefObject<boolean> = useRef<boolean>(false);
  const debounceTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null> = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedIndicatorTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null> = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedBodyRef: MutableRefObject<string> = useRef<string>("");

  const [config, setConfig] = useState<WidgetConfiguration | null>(null);
  const [body, setBody] = useState<string>("");
  const [ready, setReady] = useState<boolean>(false);
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    async function register(): Promise<void> {
      const host = await YTApp.register({
        onConfigure: (): void => setIsConfiguring(true)
      });

      if (!("readConfig" in host)) {
        throw new Error("Wrong type of API returned: probably widget used in wrong extension point");
      }
      hostRef.current = host;

      const [configuration, cache] = await Promise.all([
        host.readConfig<WidgetConfiguration>(),
        host.readCache<WidgetCache>()
      ]);

      const initialTitle: string = configuration?.title ?? "";
      const initialBody: string = cache?.body ?? "";

      setConfig(configuration);
      setBody(initialBody);
      lastSavedBodyRef.current = initialBody;

      await host.setTitle(initialTitle.trim() || t.defaultTitle, "");

      hydratedRef.current = true;
      setReady(true);
    }

    register().catch((error: unknown) => {
      throw new Error("Error registering widget: " + String(error));
    });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedIndicatorTimerRef.current) {
        clearTimeout(savedIndicatorTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || !hostRef.current || isConfiguring) {
      return;
    }

    if (body === lastSavedBodyRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const host = hostRef.current;
      if (!host) {
        return;
      }

      setSaveStatus("saving");

      host.storeCache({body})
        .then(() => {
          lastSavedBodyRef.current = body;
          setSaveStatus("saved");

          if (savedIndicatorTimerRef.current) {
            clearTimeout(savedIndicatorTimerRef.current);
          }
          savedIndicatorTimerRef.current = setTimeout(() => {
            setSaveStatus("idle");
          }, SAVED_INDICATOR_MS);
        })
        .catch(() => {
          setSaveStatus("idle");
        });
    }, SAVE_DEBOUNCE_MS);
  }, [body, isConfiguring]);

  const onBodyChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setBody(event.target.value);
  }, []);

  const doneConfiguring = useCallback((newConfig?: WidgetConfiguration): void => {
    const host = hostRef.current;
    if (!host) {
      setIsConfiguring(false);
      return;
    }

    if (newConfig) {
      setConfig(newConfig);
      host.storeConfig(newConfig)
        .then(() => host.setTitle(newConfig.title.trim() || t.defaultTitle, ""))
        .catch(() => undefined);
    }

    setIsConfiguring(false);
    host.exitConfigMode().catch(() => undefined);
  }, []);

  if (!ready) {
    return <div className="widget widget--loading"/>;
  }

  if (isConfiguring) {
    return (
      <div className="widget">
        <Configuration
          onDone={doneConfiguring}
          initialConfig={config}
        />
      </div>
    );
  }

  return (
    <div className="widget">
      <textarea
        className="widget__body"
        value={body}
        onChange={onBodyChange}
        placeholder={t.bodyPlaceholder}
      />
      <div className="widget__status" aria-live="polite">
        {saveStatus === "saving" && t.statusSaving}
        {saveStatus === "saved" && t.statusSaved}
      </div>
    </div>
  );
};

export const App: NamedExoticComponent = memo(AppComponent);
