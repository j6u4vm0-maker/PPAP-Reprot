import type { BalloonPresetKey, BalloonStyle, Page3Data, Page4Data } from "@/types/ppap";

export const BALLOON_PRESETS: Record<
  BalloonPresetKey,
  { label: string; bgColor: string; textColor: string; borderColor: string }
> = {
  classic: {
    label: "黑底白字 (範例預設)",
    bgColor: "#111827",
    textColor: "#ffffff",
    borderColor: "#ffffff",
  },
  red: {
    label: "紅底白字",
    bgColor: "#dc2626",
    textColor: "#ffffff",
    borderColor: "#ffffff",
  },
  blue: {
    label: "藍底白字",
    bgColor: "#1d4ed8",
    textColor: "#ffffff",
    borderColor: "#ffffff",
  },
  white: {
    label: "白底黑框",
    bgColor: "#ffffff",
    textColor: "#111827",
    borderColor: "#111827",
  },
};

export const DEFAULT_BALLOON_STYLE: BalloonStyle = {
  preset: "classic",
  radius: 16,
  bgColor: "#111827",
  textColor: "#ffffff",
  borderColor: "#ffffff",
  padZero: true,
};

export function createDefaultPage3(): Page3Data {
  return {
    testItems: "1.尺寸量測 Size Measurement",
    itemNo: "",
    sampleQtyNumber: 5,
    sampleQty: "5 PCS",
    testStandard: "",
    revision: "",
    issueDate: "",
    combinedStandardRevDate: "",
    testConditions: "無",
    judgementStandard: "",
    judgementSyncWithTestStandard: true,
    testEquipment: [
      "游標卡尺 Caliper : S200-01 內-031",
      "投影機 Projection : S200-05 外-116",
      "圓棒 Pin Gauge : D210-06 內-002",
    ],
  };
}

export function createDefaultPage4(): Page4Data {
  return {
    organization: "KST",
    inspectionDivision: "QC",
    partNumber: "",
    partName: "",
    levelRecordOfDesignChange: "N/A",
    documentOfEngineeringChange: "N/A",
    specifications: [],
  };
}
