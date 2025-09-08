import { useTranslation } from "react-i18next";
import type { Construction } from "../types";

interface validateConstructionTranslations {
    nameReq: string,
    adressReq: string,
    contractorReq: string,
    startDateReq: string
}

type ValidationResult = { issues: { message: string; path: (keyof Construction)[] }[] };

function validateConstruction(construction: Partial<Construction>, translations: validateConstructionTranslations): ValidationResult {
  let issues: ValidationResult['issues'] = [];

  if (!construction.name) {
    issues = [...issues, { message: translations.nameReq, path: ['name'] }];
  }

  if (!construction.location) {
    issues = [...issues, { message: translations.adressReq, path: ['location'] }];
  }

  if (!construction.contractor) {
    issues = [...issues, { message: translations.contractorReq, path: ['contractor'] }];
  }

  if (!construction.startDate) {
    issues = [...issues, { message: translations.startDateReq, path: ['startDate'] }];
  }

  return { issues };
}

export const useConstructions = () => {
    const {t} = useTranslation()

    const validate = (construction: Partial<Construction>) => validateConstruction(
        construction,
        {
            nameReq: t('constructions.nameReq'),
            adressReq: t('constructions.locationReq'),
            contractorReq: t('constructions.contractorReq'),
            startDateReq: t('constructions.startDateReq')
        }
    )

    return {
        validate
    }
}