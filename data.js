/*
  Edit this file to change the course.

  Main data types:
  - perc: data is a string/list of words. The app gets coda from LEXICON.
  - prod: data is a string/list of words. ASR checks whether the target word is heard.
  - quiz: data uses ! before the correct odd-one-out answer, e.g. "親分!登".
  - type: data is a sentence with answers in [square brackets]. The app turns them into text boxes.

  For new words, add Jyutping to LEXICON. The app infers the coda from the final Jyutping syllable.
*/

window.COURSE_DATA = {
  lexicon: {
    "盟":"mang4", "新":"san1", "很":"han2", "巾":"gan1", "生":"sang1", "肯":"hang2", "民":"man4", "羹":"gang1",
    "真":"zan1", "奔":"ban1", "陳":"can4", "頻":"pan4", "增":"zang1", "崩":"bang1", "層":"cang4", "朋":"pang4",
    "親":"can1", "分":"fan1", "登":"dang1", "騰":"tang4", "焚":"fan4", "宏":"wang4",

    "孟":"maang6", "撐":"caang1", "懶":"laan5", "攀":"paan1", "慢":"maan6", "烹":"paang1", "燦":"caan3", "冷":"laang5",
    "橙":"caang2", "蜢":"maang5", "晏":"aan3", "鰻":"maan4", "班":"baan1", "慳":"haan1", "爭":"zaang1", "蠻":"maan4", "盲":"maang4", "橫":"waang4",

    "罕":"hon2", "康":"hong1", "江":"gong1", "安":"on1", "行":"haang4", "刊":"hon1", "骯":"ong1", "乾":"gon1",
    "幹":"gon3", "汗":"hon6", "缸":"gong1", "寒":"hon4", "降":"gong3", "干":"gon1", "航":"hong4", "項":"hong6",
    "趕":"gon2", "螃":"pong4", "塘":"tong4", "芒":"mong4",

    "察":"caat3", "滑":"waat6", "劃":"waak6", "紮":"zaat3", "拆":"caak3", "勒":"lak6", "辣":"laat6", "窄":"zaak3",
    "扎":"zaat3", "法":"faat3", "刷":"saat3", "殺":"saat3", "責":"zaak3", "客":"haak3", "冊":"caak3", "格":"gaak3",
    "八":"baat3", "百":"baak3", "白":"baak6", "髮":"faat3", "伯":"baak3", "八百":"baat3 baak3", "白髮":"baak6 faat3", "伯伯":"baak3 baak3",

    "香":"hoeng1", "響":"hoeng2", "想":"soeng2", "常":"soeng4", "量":"loeng6", "亮":"loeng6", "槍":"coeng1", "牆":"coeng4",
    "剛":"gong1", "薑":"goeng1", "光":"gwong1", "僵":"goeng1", "竿":"gon1", "肝":"gon1", "疆":"goeng1", "向":"hoeng3", "撞":"zong6", "讓":"joeng6", "岸":"ngon6",

    "靚":"leng3", "輕":"heng1", "聽":"teng1", "訂":"deng3", "青":"ceng1", "驚":"geng1", "贏":"jeng4", "柄":"beng3",
    "腥":"seng1", "身":"san1", "牲":"saang1", "辛":"san1", "伸":"san1", "聲":"seng1", "申":"san1", "甥":"saang1",
    "病":"beng6", "羊":"joeng4", "鏡":"geng3", "餅":"beng2",

    "葛":"got3", "國":"gwok3", "喝":"hot3", "托":"tok3", "各":"gok3", "岳":"ngok6",
    "駱":"lok3", "漠":"mok6", "渴":"hot3", "索":"sok3", "作":"zok3", "割":"got3", "確":"kok3", "褐":"hot3", "殼":"hok3",

    "不":"bat1", "七":"cat1", "物":"mat6", "北":"bak1", "測":"cak1", "默":"mak6",
    "質":"zat1", "失":"sat1", "黑":"hak1", "側":"zak1", "塞":"sak1", "乞":"hat1", "疾":"zat6", "日":"jat6", "麥":"mak6", "骨":"gwat1", "得":"dak1", "刻":"hak1",

    "皇":"wong4", "徨":"wong4", "凰":"wong4", "湯":"tong1", "燙":"tong3", "盪":"dong6", "案":"on3", "按":"on3", "胺":"on1",
    "桿":"gon2", "鞍":"on1", "狀":"zong6", "壯":"zong3", "裝":"zong1",

    "室":"sat1", "窒":"zat6", "姪":"zat6", "軼":"jat6", "絡":"lok3", "洛":"lok3", "烙":"lok3",
    "膜":"mok2", "寞":"mok6", "佛":"fat6", "彿":"fat1", "克":"hak1", "剋":"hak1", "柏":"paak3", "泊":"paak3", "擇":"zaak6", "澤":"zaak6"
  },

  units: [
    {
      id: 1,
      title: "n/ng韻尾（1）",
      focus: "分清 -n 同 -ng：-n 舌尖前，-ng 舌根後。",
      extraDrill: "喺 TypeDuck 打 *ang，再同 *an 比較；讀嘅時候留意收尾舌位有無轉前。",
      modules: [
        { type: "perc", title: "分類練習", instruction: "請仔細聆聽錄音，然後分類個字係 -n 定係 -ng 韻尾。", data: "盟新很巾生肯民羹" },
        { type: "prod", title: "朗讀練習", instruction: "請讀出以下嘅字，睇下語音識別可唔可以認到正確嘅字。認唔到嘅話，可能係韻尾讀錯咗。", data: "真奔陳頻增崩層朋" },
        { type: "quiz", title: "選擇題1", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "親分!登" },
        { type: "quiz", title: "選擇題2", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "騰!焚宏" }
      ]
    },
    {
      id: 2,
      title: "n/ng韻尾（2）",
      focus: "練 aa 韻：-ng 收尾要開口，唔好頂牙。",
      extraDrill: "喺 TypeDuck 打 *aang，再同 *aan 比較；留意舌尖有無掂到牙。",
      modules: [
        { type: "perc", title: "分類練習", instruction: "請仔細聆聽錄音，然後分類個字係 -n 定係 -ng 韻尾。", data: "孟撐懶攀慢烹燦冷" },
        { type: "type", title: "打字練習1", instruction: "請喺 iPhone 用 TypeDuck 打出答案，然後將個字輸入下面個答案格。", hint: "2.1", data: "我係一隻[橙]色 (orange) 嘅草[蜢] (grasshopper)。" },
        { type: "type", title: "打字練習2", instruction: "請喺 iPhone 用 TypeDuck 打出答案，然後將個字輸入下面個答案格。", hint: "2.2", data: "呢度有條瞓緊[晏]覺 (afternoon nap) 嘅[鰻]魚 (eel)。" },
        { type: "quiz", title: "選擇題1", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "班慳!爭" },
        { type: "quiz", title: "選擇題2", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "!蠻盲橫" }
      ]
    },
    {
      id: 3,
      title: "n/ng韻尾（3）",
      focus: "練 on/ong：-ng 要留後面，口腔唔好收太死。",
      extraDrill: "喺 TypeDuck 打 *ong，再同 *on 比較；讀 -ng 時保持舌根向後。",
      modules: [
        { type: "perc", title: "分類練習", instruction: "請仔細聆聽錄音，然後分類個字係 -n 定係 -ng 韻尾。", data: "罕康江安行刊骯乾" },
        { type: "prod", title: "朗讀練習", instruction: "請讀出以下嘅字，睇下語音識別可唔可以認到正確嘅字。認唔到嘅話，可能係韻尾讀錯咗。", data: "幹汗缸寒降干航項" },
        { type: "type", title: "打字練習1", instruction: "請喺 iPhone 用 TypeDuck 打出答案，然後將個字輸入下面個答案格。", hint: "3.1", data: "我係一隻[趕] (rush) 時間嘅[螃]蟹 (crab)。" },
        { type: "type", title: "打字練習2", instruction: "請喺 iPhone 用 TypeDuck 打出答案，然後將個字輸入下面個答案格。", hint: "3.2", data: "池[塘] (pond) 入面有隻[芒]果 (mango)。" }
      ]
    },
    {
      id: 4,
      title: "t/k韻尾（1）",
      focus: "分清 -t 同 -k：-t 前收，-k 後收。",
      extraDrill: "喺 TypeDuck 打 *aak，再同 *aat 比較；留意收尾前後閉合位置。",
      modules: [
        { type: "perc", title: "分類練習", instruction: "請仔細聆聽錄音，然後分類個字係 -t 定係 -k 韻尾。", data: "察滑劃紮拆勒辣窄" },
        { type: "prod", title: "朗讀練習", instruction: "請讀出以下嘅字，睇下語音識別可唔可以認到正確嘅字。認唔到嘅話，可能係韻尾讀錯咗。", data: "扎法刷殺責客冊格" },
        { type: "type", title: "打字練習", instruction: "請喺 iPhone 用 TypeDuck 打出答案，然後將個字輸入下面個答案格。", hint: "4.1", data: "有[八百] (eight hundred) 個滿頭[白髮] (white hair) 嘅[伯伯] (uncle)。" }
      ]
    },
    {
      id: 5,
      title: "n/ng韻尾（4）",
      focus: "記住：oe 韻只可以配 -ng，唔配 -n。",
      extraDrill: "喺 TypeDuck 打 *oeng；呢組只會係 -ng，收尾舌根向後、微開口。",
      modules: [
        { type: "prod", title: "朗讀練習", instruction: "請讀出以下嘅字。注意：韻母 oe 只可以配 -ng，唔可以配 -n。", data: "香響想常量亮槍牆" },
        { type: "perc", title: "分類練習", instruction: "請仔細聆聽錄音，然後分類個字係 -n 定係 -ng 韻尾。", data: "剛薑光僵竿肝疆江" },
        { type: "quiz", title: "選擇題1", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "!汗項向" },
        { type: "quiz", title: "選擇題2", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "撞讓!岸" }
      ]
    },
    {
      id: 6,
      title: "n/ng韻尾（5）",
      focus: "記住：e 韻只可以配 -ng，唔配 -n。",
      extraDrill: "喺 TypeDuck 打 *eng；讀尾音時保持舌根向後。",
      modules: [
        { type: "prod", title: "朗讀練習", instruction: "請讀出以下嘅字。注意：韻母 e 只可以配 -ng，唔可以配 -n。", data: "靚輕聽訂青驚贏柄" },
        { type: "perc", title: "分類練習", instruction: "請仔細聆聽錄音，然後分類個字係 -n 定係 -ng 韻尾。", data: "腥身牲辛伸聲申甥" },
        { type: "type", title: "打字練習", instruction: "請喺 iPhone 用 TypeDuck 打出答案，然後將個字輸入下面個答案格。", hint: "6.1", data: "[病] (sick) 咗嘅[羊] (sheep) 咩咩望住塊[鏡] (mirror) 食[餅] (biscuit)。" }
      ]
    },
    {
      id: 7,
      title: "t/k韻尾（2）",
      focus: "練 ok/ot：-k 留後，-t 向前。",
      extraDrill: "喺 TypeDuck 打 *ok，再同 *ot 比較；收尾時感受前後口感。",
      modules: [
        { type: "perc", title: "分類練習", instruction: "請仔細聆聽錄音，然後分類個字係 -t 定係 -k 韻尾。", data: "葛國喝托各岳" },
        { type: "type", title: "打字練習1", instruction: "請喺 iPhone 用 TypeDuck 打出答案，然後將個字輸入下面個答案格。", hint: "7.1", data: "[駱]駝 (camel) 喺沙[漠] (desert) 好口[渴] (thirsty)。" },
        { type: "quiz", title: "選擇題1", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "索作!割" },
        { type: "quiz", title: "選擇題2", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "確!褐殼" }
      ]
    },
    {
      id: 8,
      title: "t/k韻尾（3）",
      focus: "練 ak/at：-k 後閉，-t 前閉。",
      extraDrill: "喺 TypeDuck 打 *ak，再同 *at 比較；留意舌尖有無向前頂。",
      modules: [
        { type: "perc", title: "分類練習", instruction: "請仔細聆聽錄音，然後分類個字係 -t 定係 -k 韻尾。", data: "不七物北測默" },
        { type: "prod", title: "朗讀練習", instruction: "請讀出以下嘅字，睇下語音識別可唔可以認到正確嘅字。認唔到嘅話，可能係韻尾讀錯咗。", data: "質失黑側塞乞" },
        { type: "quiz", title: "選擇題1", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "疾日!麥" },
        { type: "quiz", title: "選擇題2", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "!骨得刻" }
      ]
    },
    {
      id: 9,
      title: "n/ng韻尾（6）",
      focus: "字形可以幫手，但最後都要靠舌位判斷。",
      extraDrill: "喺 TypeDuck 打 *ong 同 *on；可留意字形提示，但一定要聽同讀去核對。",
      modules: [
        { type: "prod", title: "朗讀練習", instruction: "請讀出以下嘅字，睇下語音識別可唔可以認到正確嘅字。注意：有時字形部件可以提示個字係 -n 定 -ng 尾。", data: "皇徨凰湯燙盪案按胺" },
        { type: "type", title: "打字練習1", instruction: "請喺 iPhone 用 TypeDuck 打出答案，然後將個字輸入下面個答案格。", hint: "9.1", data: "對面[岸] (shore) 旗[桿] (flagpole) 下面有個人流晒[汗] (sweat) 騎喺馬[鞍] (saddle) 上面睇緊本[刊]物 (magazine)。" },
        { type: "type", title: "打字練習2", instruction: "請喺 iPhone 用 TypeDuck 打出答案，然後將個字輸入下面個答案格。", hint: "9.2", data: "拎住獎[狀] (certificate) 睇落好強[壯] (strong) 嗰個人[裝]扮 (dress up) 得好特別。" }
      ]
    },
    {
      id: 10,
      title: "t/k韻尾（4）",
      focus: "字形加口感一齊用，分清 -t/-k 前後閉合。",
      extraDrill: "喺 TypeDuck 打 *ak 同 *at；留意字形提示之餘，確認舌尖有無向前。",
      modules: [
        { type: "prod", title: "朗讀練習", instruction: "請讀出以下嘅字，睇下語音識別可唔可以認到正確嘅字。注意：有時字形部件可以提示個字係 -t 定 -k 尾。", data: "室窒姪失疾軼絡洛烙" },
        { type: "perc", title: "分類練習", instruction: "請仔細聆聽錄音，然後分類個字係 -t 定係 -k 韻尾。", data: "膜寞佛彿克剋" },
        { type: "quiz", title: "選擇題1", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "柏泊!八" },
        { type: "quiz", title: "選擇題2", instruction: "請聆聽錄音，揀出邊個字嘅韻尾同其他字唔同。", data: "擇!紮澤" }
      ]
    }
  ]
};
