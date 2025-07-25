// 漢字→ひらがな変換辞書
export const kanjiToHiragana: Record<string, string> = {
  // 野菜・食材関連
  '玉': 'たま',
  'ねぎ': 'ねぎ',
  '人参': 'にんじん',
  '大根': 'だいこん',
  '白菜': 'はくさい',
  'キャベツ': 'きゃべつ',
  'レタス': 'れたす',
  'トマト': 'とまと',
  '茄子': 'なす',
  'ピーマン': 'ぴーまん',
  'パプリカ': 'ぱぷりか',
  'キュウリ': 'きゅうり',
  '胡瓜': 'きゅうり',
  '南瓜': 'かぼちゃ',
  'カボチャ': 'かぼちゃ',
  '芋': 'いも',
  'ジャガイモ': 'じゃがいも',
  'サツマイモ': 'さつまいも',
  '里芋': 'さといも',
  '山芋': 'やまいも',
  '長芋': 'ながいも',
  '生姜': 'しょうが',
  'ニンニク': 'にんにく',
  '玉葱': 'たまねぎ',
  '葱': 'ねぎ',
  '韮': 'にら',
  '春菊': 'しゅんぎく',
  '小松菜': 'こまつな',
  '水菜': 'みずな',
  '青梗菜': 'ちんげんさい',
  '空心菜': 'くうしんさい',
  '豆苗': 'とうみょう',
  'もやし': 'もやし',
  '椎茸': 'しいたけ',
  '舞茸': 'まいたけ',
  'エリンギ': 'えりんぎ',
  'しめじ': 'しめじ',
  'エノキ': 'えのき',
  'キノコ': 'きのこ',
  '茸': 'きのこ',
  
  // 肉類
  '豚肉': 'ぶたにく',
  '牛肉': 'ぎゅうにく',
  '鶏肉': 'とりにく',
  '羊肉': 'ひつじにく',
  '馬肉': 'ばにく',
  '鹿肉': 'しかにく',
  
  // 魚介類
  '鮭': 'さけ',
  '鯖': 'さば',
  '鯵': 'あじ',
  '鰯': 'いわし',
  '秋刀魚': 'さんま',
  '鰹': 'かつお',
  '鮪': 'まぐろ',
  '鰤': 'ぶり',
  '鯛': 'たい',
  '鱈': 'たら',
  '鮃': 'ひらめ',
  '鰈': 'かれい',
  '海老': 'えび',
  '蟹': 'かに',
  '牡蠣': 'かき',
  '蛤': 'はまぐり',
  '帆立': 'ほたて',
  '烏賊': 'いか',
  '蛸': 'たこ',
  '海苔': 'のり',
  '昆布': 'こんぶ',
  '若布': 'わかめ',
  '海藻': 'かいそう',
  
  // 調味料・調理関連
  '醤油': 'しょうゆ',
  '味噌': 'みそ',
  '塩': 'しお',
  '砂糖': 'さとう',
  '胡椒': 'こしょう',
  '唐辛子': 'とうがらし',
  '七味': 'しちみ',
  '山椒': 'さんしょう',
  '芥子': 'からし',
  '酢': 'す',
  '油': 'あぶら',
  '胡麻油': 'ごまあぶら',
  'オリーブ油': 'おりーぶあぶら',
  '菜種油': 'なたねあぶら',
  '酒': 'さけ',
  '日本酒': 'にほんしゅ',
  '料理酒': 'りょうりしゅ',
  '味醂': 'みりん',
  '出汁': 'だし',
  '鰹節': 'かつおぶし',
  '削り節': 'けずりぶし',
  '顆粒': 'かりゅう',
  '粉末': 'ふんまつ',
  '固形': 'こけい',
  
  // その他
  '豆腐': 'とうふ',
  '納豆': 'なっとう',
  '卵': 'たまご',
  '牛乳': 'ぎゅうにゅう',
  '豆乳': 'とうにゅう',
  'ヨーグルト': 'よーぐると',
  'チーズ': 'ちーず',
  'バター': 'ばたー',
  'マーガリン': 'まーがりん',
  '生クリーム': 'なまくりーむ',
  '小麦粉': 'こむぎこ',
  '片栗粉': 'かたくりこ',
  'パン粉': 'ぱんこ',
  '天ぷら粉': 'てんぷらこ',
  'お好み焼き粉': 'おこのみやきこ',
  'ベーキングパウダー': 'べーきんぐぱうだー',
  '重曹': 'じゅうそう',
  '酵母': 'こうぼ',
  'ドライイースト': 'どらいいーすと',
  '麺': 'めん',
  '蕎麦': 'そば',
  '烏冬': 'うどん',
  '素麺': 'そうめん',
  'ラーメン': 'らーめん',
  'パスタ': 'ぱすた',
  '米': 'こめ',
  '玄米': 'げんまい',
  '雑穀': 'ざっこく',
  '麦': 'むぎ',
  '燕麦': 'えんばく',
  '粟': 'あわ',
  '稗': 'ひえ',
  '黍': 'きび',
};

// レシピ名の表記ゆれ・同義語対応
const recipeSynonyms: [string, string][] = [
  ["肉じゃが", "にくじゃが"],
  ["ハンバーグ", "はんばーぐ"],
  ["生姜焼き", "しょうがやき"],
  ["鶏の唐揚げ", "とりのからあげ"],
  ["豚の角煮", "ぶたのかくに"],
  ["鮭の塩焼き", "さけのしおやき"],
  ["鯖の味噌煮", "さばのみそに"],
  ["照り焼きチキン", "てりやきちきん"],
  ["鶏の南蛮漬け", "とりのなんばんづけ"],
  ["鶏むね肉のピカタ", "とりむねにくのぴかた"],
  ["チキンカツ", "ちきんかつ"],
  ["エビフライ", "えびふらい"],
  ["回鍋肉", "ホイコーロー"],
  ["ホイコーロー", "回鍋肉"],
  ["麻婆豆腐", "まーぼーどうふ"],
  ["豚キムチ炒め", "ぶたきむちいため"],
  ["鶏と大根の煮物", "とりとだいこんのにもの"],
  ["鮭のホイル焼き", "さけのほいるやき"],
  ["ぶりの照り焼き", "ぶりのてりやき"],
  ["鶏団子の甘酢あん", "とりだんごのあまずあん"],
  ["厚揚げと野菜の味噌炒め", "あつあげとやさいのみそいため"],
  ["鯖の竜田揚げ", "さばのたつたあげ"],
  ["鶏手羽元のさっぱり煮", "とりてばもとのさっぱりに"],
  ["鯵の南蛮漬け", "あじのなんばんづけ"],
  ["鶏の味噌漬け焼き", "とりのみそづけやき"],
  ["エビチリ", "えびちり"],
  ["エビチリ", "家庭向けえびちり"],
  ["ほうれん草のごま和え", "ほうれんそうのごまあえ"],
  ["ひじきの煮物", "ひじきのにもの"],
  ["きんぴらごぼう", "きんぴらごぼう"],
  ["切り干し大根の煮物", "きりぼしだいこんのにもの"],
  ["冷ややっこ", "ひややっこ"],
  ["小松菜のナムル", "こまつなのなむる"],
  ["キャベツの塩昆布和え", "きゃべつのしおこんぶあえ"],
  ["ピーマンとじゃこの炒め物", "ぴーまんとじゃこのいためもの"],
  ["かぼちゃの煮物", "かぼちゃのにもの"],
  ["長芋の梅和え", "ながいものうめあえ"],
  ["ミニトマトのマリネ", "みにとまとのまりね"],
  ["アスパラベーコン炒め", "あすぱらべーこんいため"],
  ["ブロッコリーの胡麻和え", "ぶろっこりーのごまあえ"],
  ["マカロニサラダ", "まかろにさらだ"],
  ["こんにゃくのピリ辛炒め", "こんにゃくのぴりからいため"],
  ["豆腐とわかめの味噌汁", "とうふとわかめのみそしる"],
  ["なめこの味噌汁", "なめこのみそしる"],
  ["大根と油揚げの味噌汁", "だいこんとあぶらあげのみそしる"],
  ["じゃがいもの味噌汁", "じゃがいものみそしる"],
  ["玉ねぎと卵のスープ", "たまねぎとたまごのすーぷ"],
  ["野菜たっぷり中華スープ", "やさいたっぷりちゅうかすーぷ"],
  ["かぼちゃの味噌汁", "かぼちゃのみそしる"],
  ["かき玉汁", "かきたまじる"],
  ["わかめとたまごのスープ", "わかめとたまごのすーぷ"],
  ["三つ葉の吸い物", "みつばのすいもの"],
  ["カレーライス", "かれーらいす"],
  ["親子丼", "おやこどん"],
  ["牛丼", "ぎゅうどん"],
  ["オムライス", "おむらいす"],
  ["炊き込みご飯", "たきこみごはん"],
  ["そぼろ丼", "そぼろどん"],
  ["三色丼", "さんしょくどん"],
  ["チャーハン", "ちゃーはん"],
  ["焼きおにぎり", "やきおにぎり"],
  ["しらすと大葉の混ぜご飯", "しらすとおおばのまぜごはん"],
  ["高菜チャーハン", "たかなちゃーはん"],
  ["フルーツヨーグルト", "ふるーつよーぐると"],
  ["さつまいも茶巾", "さつまいもちゃきん"],
  ["手作りゼリー", "てづくりぜりー"],
  ["黒ごまプリン", "くろごまぷりん"],
  ["フレンチトースト", "ふれんちとーすと"],
  ["春キャベツのコールスロー", "はるきゃべつのこーるすろー"],
  ["新玉ねぎのサラダ", "しんたまねぎのさらだ"],
  ["なすの焼き浸し", "なすのやきびたし"],
  ["とうもろこしご飯", "とうもろこしごはん"],
  ["かぼちゃのそぼろ煮", "かぼちゃのそぼろに"],
  ["しめじと小松菜の炒め物", "しめじとこまつなのいためもの"],
  ["さつまいもご飯", "さつまいもごはん"],
  ["白菜と豚のミルフィーユ鍋", "はくさいとぶたのみるふぃーゆなべ"],
  ["かぶのそぼろ煮", "かぶのそぼろに"],
  ["ふろふき大根", "ふろふきだいこん"],
  ["雑穀米のサラダ", "ざっこくまいのさらだ"],
  ["ブロッコリーとゆで卵のサラダ", "ぶろっこりーとゆでたまごのさらだ"],
  ["鶏むね肉のヨーグルト焼き", "とりむねにくのよーぐるとやき"],
  ["豆乳スープ", "とうにゅうすーぷ"],
  ["キウイとヨーグルトの和え物", "きういとよーぐるとのあえもの"],
  ["ごま豆乳スープ", "ごまとうにゅうすーぷ"],
  ["もち麦入り炊き込みご飯", "もちむぎいりたきこみごはん"],
  ["ささみの梅しそ焼き", "ささみのうめしそやき"],
  ["トマトとアボカドのサラダ", "とまととあぼかどのさらだ"],
  ["豆腐ドーナツ", "とうふどーなつ"],
  ["卵チャーハン", "たまごちゃーはん"],
  ["お茶漬け", "おちゃづけ"],
  ["梅お茶漬け", "うめおちゃづけ"],
  ["鮭お茶漬け", "さけおちゃづけ"],
  ["レンジで蒸し野菜", "れんじでむしやさい"],
  ["ツナときゅうりの和え物", "つなときゅうりのあえもの"],
  ["レンジ肉じゃが", "れんじにくじゃが"],
  ["レンジでピーマンおかか和え", "れんじでぴーまんおかかあえ"],
  ["レンジスクランブルエッグ丼", "れんじすくらんぶるえっぐどん"],
  ["しらすおろし丼", "しらすおろしどん"],
  ["しめじのバター醤油炒め", "しめじのばたーしょうゆいため"],
  ["野菜スープ", "やさいすーぷ"],
  ["コンソメスープ", "こんそめすーぷ"],
];

// 一般的な料理名の略称・俗称対応
const commonCookingTerms: [string, string][] = [
  ["味噌汁", "みそしる"],
  ["みそしる", "味噌汁"],
  ["スープ", "すーぷ"],
  ["すーぷ", "スープ"],
  ["丼", "どん"],
  ["どん", "丼"],
  ["炒め", "いため"],
  ["いため", "炒め"],
  ["煮物", "にもの"],
  ["にもの", "煮物"],
  ["焼き", "やき"],
  ["やき", "焼き"],
  ["揚げ", "あげ"],
  ["あげ", "揚げ"],
  ["和え", "あえ"],
  ["あえ", "和え"],
  ["漬け", "づけ"],
  ["づけ", "漬け"],
  ["ご飯", "ごはん"],
  ["ごはん", "ご飯"],
  ["ライス", "らいす"],
  ["らいす", "ライス"],
  ["サラダ", "さらだ"],
  ["さらだ", "サラダ"],
  ["プリン", "ぷりん"],
  ["ぷりん", "プリン"],
  ["ゼリー", "ぜりー"],
  ["ぜりー", "ゼリー"],
  ["トースト", "とーすと"],
  ["とーすと", "トースト"],
  ["チャーハン", "ちゃーはん"],
  ["ちゃーはん", "チャーハン"],
  ["お茶漬け", "おちゃづけ"],
  ["おちゃづけ", "お茶漬け"],
];

// synonymPairsにレシピ名の表記ゆれも追加
const synonymPairs: [string, string][] = [
  ["カレーライス", "かれー"],
  ["かれー", "カレーライス"],
  ["焼き鮭", "シャケ"],
  ["シャケ", "焼き鮭"],
  ...recipeSynonyms,
  ...commonCookingTerms,
];

/**
 * 漢字・俗称を含むテキストをひらがなに変換し、同義語も置換する
 */
export const convertKanjiToHiragana = (text: string): string => {
  let result = text;
  // 俗称・同義語を双方向で置換
  for (const [a, b] of synonymPairs) {
    result = result.replace(new RegExp(a, 'g'), b);
    result = result.replace(new RegExp(b, 'g'), a);
  }
  // 辞書に登録されている漢字を順次変換
  for (const [kanji, hiragana] of Object.entries(kanjiToHiragana)) {
    result = result.replace(new RegExp(kanji, 'g'), hiragana);
  }
  return result;
}; 