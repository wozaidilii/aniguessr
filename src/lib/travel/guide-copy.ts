import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";

const en = {
  title: "Guides for this journey",
  intro:
    "Selected reading matched to your scheduled destinations and interests. Open the source for the full guide and current details.",
  official: "Tourism office / operator",
  editorial: "Travel editorial",
  platform: "Booking-platform editorial",
  language: "Original language",
  english: "English",
  traditional: "Traditional Chinese",
  checked: "Link reviewed",
  matches: "Matches",
  transport: "Transport & routes",
  read: "Read original guide",
  copy: "Copy guide list",
  copied: "Guide list copied.",
  copyFallback: "Copy the text below:",
  caveat:
    "Link review is not a guarantee of current hours, prices or access. Editorial articles can contain commercial recommendations. Guide ranking is independent of affiliate commission.",
  empty:
    "We do not yet have reviewed guides for these destinations and interests. Nearby searches and destination links remain available below.",
  community: "Ask travelers about your plan",
  communityIntro:
    "Prepare an English question for japan-guide.com's Japan travel forum. Review and edit the text, then post it yourself using the forum's rules and sign-in flow.",
  prepare: "Prepare a question",
  regenerate: "Regenerate from this trip",
  questionLabel: "Editable English question",
  copyQuestion: "Copy question",
  questionCopied: "Question copied. Nothing has been posted.",
  openForum: "Open Japan travel forum",
  privacy:
    "The draft omits exact travel dates, coordinates and private trip links. No message is sent automatically.",
  questionUnavailable:
    "Community handoff currently covers our reviewed Japanese destinations.",
};
type Copy = typeof en;
const zh: Copy = {
  title: "适合这趟旅行的攻略",
  intro: "按已排入行程的地区与兴趣精选阅读材料。完整攻略和当前信息请查看原文。",
  official: "旅游局 / 运营方",
  editorial: "旅行编辑攻略",
  platform: "预订平台编辑攻略",
  language: "原文语言",
  english: "英文",
  traditional: "繁体中文",
  checked: "链接核验",
  matches: "适用于",
  transport: "交通与路线",
  read: "阅读原文",
  copy: "复制攻略清单",
  copied: "攻略清单已复制。",
  copyFallback: "请复制下方文字：",
  caveat:
    "链接核验不代表营业时间、价格或通行条件始终有效。编辑攻略可能含商业推荐；本站攻略排序不受推广佣金影响。",
  empty:
    "这些地区与兴趣暂时没有已核验攻略，可继续使用下方的周边搜索和目的地链接。",
  community: "请旅行社区帮你看看行程",
  communityIntro:
    "为 japan-guide.com 的日本旅行论坛生成英文提问。先检查并修改内容，再按论坛规则自行登录发布。",
  prepare: "生成交流提纲",
  regenerate: "按当前行程重新生成",
  questionLabel: "可编辑的英文提问",
  copyQuestion: "复制提问",
  questionCopied: "提问已复制，尚未发布。",
  openForum: "打开日本旅行论坛",
  privacy: "提纲省略具体出行日期、坐标和私人行程链接，不会自动向外发送消息。",
  questionUnavailable: "社区交流入口目前覆盖已核验的日本目的地。",
};
const tw: Copy = {
  title: "適合這趟旅行的攻略",
  intro: "按已排入行程的地區與興趣精選閱讀材料。完整攻略與目前資訊請查看原文。",
  official: "觀光局 / 營運方",
  editorial: "旅行編輯攻略",
  platform: "預訂平台編輯攻略",
  language: "原文語言",
  english: "英文",
  traditional: "繁體中文",
  checked: "連結核驗",
  matches: "適用於",
  transport: "交通與路線",
  read: "閱讀原文",
  copy: "複製攻略清單",
  copied: "攻略清單已複製。",
  copyFallback: "請複製下方文字：",
  caveat:
    "連結核驗不代表營業時間、價格或通行條件始終有效。編輯攻略可能含商業推薦；本站攻略排序不受推廣佣金影響。",
  empty:
    "這些地區與興趣暫時沒有已核驗攻略，可繼續使用下方的周邊搜尋與目的地連結。",
  community: "請旅行社群幫你看看行程",
  communityIntro:
    "為 japan-guide.com 的日本旅行論壇產生英文提問。先檢查並修改內容，再按論壇規則自行登入發布。",
  prepare: "產生交流提綱",
  regenerate: "按目前行程重新產生",
  questionLabel: "可編輯的英文提問",
  copyQuestion: "複製提問",
  questionCopied: "提問已複製，尚未發布。",
  openForum: "開啟日本旅行論壇",
  privacy: "提綱省略具體出行日期、座標與私人行程連結，不會自動向外傳送訊息。",
  questionUnavailable: "社群交流入口目前涵蓋已核驗的日本目的地。",
};
const ja: Copy = {
  title: "この旅に合う旅行ガイド",
  intro:
    "日程に入った地域と興味に合う読み物を選びました。詳しい内容と最新情報は原文でご確認ください。",
  official: "観光局・運営事業者",
  editorial: "旅行編集記事",
  platform: "予約サイトの編集記事",
  language: "原文の言語",
  english: "英語",
  traditional: "繁体字中国語",
  checked: "リンク確認日",
  matches: "対象",
  transport: "交通・ルート",
  read: "原文を読む",
  copy: "ガイド一覧をコピー",
  copied: "ガイド一覧をコピーしました。",
  copyFallback: "以下の文章をコピーしてください：",
  caveat:
    "リンク確認は営業時間・料金・入場条件の最新性を保証しません。記事には商業的な紹介が含まれることがあります。ガイドの順位は紹介手数料に左右されません。",
  empty:
    "この地域と興味に合う確認済みガイドはまだありません。以下の周辺検索と目的地リンクをご利用ください。",
  community: "旅行者に旅程を相談",
  communityIntro:
    "japan-guide.com の日本旅行フォーラム向けに英語の質問を作成します。内容を確認・編集し、フォーラムのルールに従ってご自身でログインして投稿してください。",
  prepare: "質問の下書きを作成",
  regenerate: "現在の旅程で再作成",
  questionLabel: "編集できる英語の質問",
  copyQuestion: "質問をコピー",
  questionCopied: "質問をコピーしました。投稿はしていません。",
  openForum: "日本旅行フォーラムを開く",
  privacy:
    "具体的な旅行日、座標、非公開の旅程リンクは含めません。自動送信は行いません。",
  questionUnavailable:
    "現在、確認済みの日本の目的地がコミュニティ相談の対象です。",
};
export function getGuideCopy(locale: PilgrimageLocale): Copy {
  return { en, zh, "zh-tw": tw, ja }[locale];
}
