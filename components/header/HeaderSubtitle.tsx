"use client";

import { t } from "../../lib/i18n";
import { useSettings } from "../useSettings";

export default function HeaderSubtitle() {
  const { lang } = useSettings();
  return <p className="chat-page__subtitle">{t(lang, "subtitle")}</p>;
}
