/**
 * Mainland / Taiwan pairs to flag in the zh-TW review CSV.
 * A hit on either side means a person should check the wording.
 */
export const CROSS_STRAIT_TERMS = [
  { id: "地铁/捷運", patterns: ["地铁", "地鐵", "捷運"] },
  { id: "打卡", patterns: ["打卡"] },
  { id: "视频/影片", patterns: ["视频", "視頻", "影片"] },
  { id: "信息/資訊", patterns: ["信息", "資訊"] },
  { id: "网络/網路", patterns: ["网络", "網路", "網絡"] },
  { id: "软件/軟體", patterns: ["软件", "軟件", "軟體"] },
  { id: "默认/預設", patterns: ["默认", "默認", "預設"] },
  { id: "质量/品質", patterns: ["质量", "質量", "品質"] },
  { id: "程序/程式", patterns: ["程序", "程式"] },
  { id: "服务器/伺服器", patterns: ["服务器", "服務器", "伺服器"] },
  { id: "链接/連結", patterns: ["链接", "鏈接", "連結"] },
  { id: "打印/列印", patterns: ["打印", "列印"] },
  { id: "鼠标/滑鼠", patterns: ["鼠标", "鼠標", "滑鼠"] },
  { id: "硬盘/硬碟", patterns: ["硬盘", "硬盤", "硬碟"] },
  { id: "屏幕/螢幕", patterns: ["屏幕", "螢幕"] },
  { id: "键盘/鍵盤", patterns: ["键盘", "鍵盤"] },
  { id: "内存/記憶體", patterns: ["内存", "內存", "記憶體"] },
  { id: "芯片/晶片", patterns: ["芯片", "晶片"] },
  { id: "激光/雷射", patterns: ["激光", "雷射"] },
  { id: "像素/畫素", patterns: ["像素", "畫素"] },
  { id: "博客/部落格", patterns: ["博客", "部落格"] },
  { id: "出租车/計程車", patterns: ["出租车", "出租車", "計程車"] },
  { id: "公交/公車", patterns: ["公交", "公車"] },
  { id: "自行车/腳踏車", patterns: ["自行车", "自行車", "腳踏車"] },
  { id: "酒店/飯店", patterns: ["酒店", "飯店"] },
  { id: "项目/專案", patterns: ["项目", "項目", "專案"] },
  { id: "用户/使用者", patterns: ["用户", "用戶", "使用者"] },
  { id: "界面/介面", patterns: ["界面", "介面"] },
  { id: "窗口/視窗", patterns: ["窗口", "視窗"] },
  { id: "文件夹/資料夾", patterns: ["文件夹", "文件夾", "資料夾"] },
  { id: "设置/設定", patterns: ["设置", "設置", "設定"] },
  { id: "搜索/搜尋", patterns: ["搜索", "搜尋"] },
  { id: "在线/線上", patterns: ["在线", "在線", "線上"] },
  { id: "账号/帳號", patterns: ["账号", "賬號", "帳號"] },
  { id: "登录/登入", patterns: ["登录", "登錄", "登入"] },
  { id: "短信/簡訊", patterns: ["短信", "簡訊"] },
  { id: "人工智能/人工智慧", patterns: ["人工智能", "人工智慧"] },
  { id: "互联网/網際網路", patterns: ["互联网", "互聯網", "網際網路"] },
  { id: "兼容/相容", patterns: ["兼容", "相容"] },
  { id: "算法/演算法", patterns: ["算法", "演算法"] },
  { id: "数据库/資料庫", patterns: ["数据库", "數據庫", "資料庫"] },
  { id: "插件/外掛", patterns: ["插件", "外掛"] },
  { id: "分辨率/解析度", patterns: ["分辨率", "解析度"] },
  { id: "带宽/頻寬", patterns: ["带宽", "帶寬", "頻寬"] },
  { id: "缓存/快取", patterns: ["缓存", "緩存", "快取"] },
  { id: "变量/變數", patterns: ["变量", "變量", "變數"] },
  { id: "函数/函式", patterns: ["函数", "函數", "函式"] },
  { id: "数组/陣列", patterns: ["数组", "數組", "陣列"] },
  { id: "性能/效能", patterns: ["性能", "效能"] },
  { id: "渠道/通路", patterns: ["渠道", "通路"] },
  { id: "粉丝/粉絲", patterns: ["粉丝", "粉絲"] },
  { id: "点赞/按讚", patterns: ["点赞", "點贊", "按讚"] },
  { id: "外卖/外送", patterns: ["外卖", "外賣", "外送"] },
  { id: "方便面/泡麵", patterns: ["方便面", "方便麵", "泡麵"] },
  { id: "酸奶/優格", patterns: ["酸奶", "優格"] },
  { id: "土豆/馬鈴薯", patterns: ["土豆", "馬鈴薯"] },
  { id: "菠萝/鳳梨", patterns: ["菠萝", "菠蘿", "鳳梨"] },
  { id: "芝士/起司", patterns: ["芝士", "起司"] },
  { id: "立交桥/交流道", patterns: ["立交桥", "立交橋", "交流道"] },
  { id: "人行横道/斑馬線", patterns: ["人行横道", "人行橫道", "斑馬線"] },
  { id: "幼儿园/幼兒園", patterns: ["幼儿园", "幼兒園"] },
  { id: "身份证/身分證", patterns: ["身份证", "身份證", "身分證"] },
  { id: "制作/製作", patterns: ["制作", "製作"] },
  { id: "公布/公佈", patterns: ["公布", "公佈"] },
];

export function crossStraitFlags(text) {
  const haystack = String(text ?? "");
  if (!haystack) return [];
  return CROSS_STRAIT_TERMS.filter((term) =>
    term.patterns.some((pattern) => haystack.includes(pattern)),
  ).map((term) => term.id);
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function reviewRow(row) {
  const flags = crossStraitFlags(`${row.zh ?? ""}\n${row.zhTw ?? ""}`);
  return {
    kind: row.kind,
    id: row.id,
    field: row.field,
    source: row.source,
    zh: row.zh ?? "",
    zhTw: row.zhTw ?? "",
    flags: flags.join(" | "),
    flagged: flags.length > 0 ? "yes" : "no",
  };
}

const COLUMNS = [
  "kind",
  "id",
  "field",
  "source",
  "zh",
  "zh_tw",
  "flags",
  "flagged",
];

/** UTF-8 CSV with a BOM so spreadsheet apps keep the Chinese text. */
export function reviewCsv(rows) {
  const body = rows
    .map((row) =>
      [
        row.kind,
        row.id,
        row.field,
        row.source,
        row.zh,
        row.zhTw,
        row.flags,
        row.flagged,
      ]
        .map(csvCell)
        .join(","),
    )
    .join("\n");
  return `\uFEFF${COLUMNS.join(",")}\n${body}${body ? "\n" : ""}`;
}
