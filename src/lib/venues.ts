// 全24競艇場マスタデータ
export const VENUES = [
  { code: "01", name: "桐生", prefecture: "群馬県" },
  { code: "02", name: "戸田", prefecture: "埼玉県" },
  { code: "03", name: "江戸川", prefecture: "東京都" },
  { code: "04", name: "平和島", prefecture: "東京都" },
  { code: "05", name: "多摩川", prefecture: "東京都" },
  { code: "06", name: "浜名湖", prefecture: "静岡県" },
  { code: "07", name: "蒲郡", prefecture: "愛知県" },
  { code: "08", name: "常滑", prefecture: "愛知県" },
  { code: "09", name: "津", prefecture: "三重県" },
  { code: "10", name: "三国", prefecture: "福井県" },
  { code: "11", name: "びわこ", prefecture: "滋賀県" },
  { code: "12", name: "住之江", prefecture: "大阪府" },
  { code: "13", name: "尼崎", prefecture: "兵庫県" },
  { code: "14", name: "鳴門", prefecture: "徳島県" },
  { code: "15", name: "丸亀", prefecture: "香川県" },
  { code: "16", name: "児島", prefecture: "岡山県" },
  { code: "17", name: "宮島", prefecture: "広島県" },
  { code: "18", name: "徳山", prefecture: "山口県" },
  { code: "19", name: "下関", prefecture: "山口県" },
  { code: "20", name: "若松", prefecture: "福岡県" },
  { code: "21", name: "芦屋", prefecture: "福岡県" },
  { code: "22", name: "福岡", prefecture: "福岡県" },
  { code: "23", name: "唐津", prefecture: "佐賀県" },
  { code: "24", name: "大村", prefecture: "長崎県" },
] as const;

export type VenueCode = (typeof VENUES)[number]["code"];
