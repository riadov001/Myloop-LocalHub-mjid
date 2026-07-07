import { PublicLayout } from "@/components/layout/PublicLayout";
import { useTranslation } from "react-i18next";

export function Legal() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <div className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold mb-6">{t("legal.title")}</h1>
        <div className="prose prose-blue">
          <p>{t("legal.date")}</p>
          <p>{t("legal.description")}</p>
          <h3>{t("legal.editor_title")}</h3>
          <p>{t("legal.editor_desc")}</p>
          <h3>{t("legal.hosting_title")}</h3>
          <p>{t("legal.hosting_desc")}</p>
        </div>
      </div>
    </PublicLayout>
  );
}

export function CGU() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <div className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold mb-6">{t("cgu.title")}</h1>
        <div className="prose prose-blue">
          <p>{t("cgu.intro")}</p>
          <h3>{t("cgu.access_title")}</h3>
          <p>{t("cgu.access_desc")}</p>
          <h3>{t("cgu.liability_title")}</h3>
          <p>{t("cgu.liability_desc")}</p>
        </div>
      </div>
    </PublicLayout>
  );
}

export function Privacy() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <div className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold mb-6">{t("privacy.title")}</h1>
        <div className="prose prose-blue">
          <p>{t("privacy.intro")}</p>
          <h3>{t("privacy.collection_title")}</h3>
          <p>{t("privacy.collection_desc")}</p>
          <h3>{t("privacy.usage_title")}</h3>
          <p>{t("privacy.usage_desc")}</p>
          <h3>{t("privacy.rights_title")}</h3>
          <p>{t("privacy.rights_desc")}</p>
        </div>
      </div>
    </PublicLayout>
  );
}
