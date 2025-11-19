/*
CREATE TABLE word (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    word      TEXT UNIQUE NOT NULL,
    tag  TEXT,
    pos       TEXT,          -- 词性，如 "v./n."
    meaning   TEXT NOT NULL,    -- 中文释义，多义用 | 分隔
    audio  TEXT,             -- 发音文件 URL
    is_collected BOOLEAN
);

SELECT * from word;--查询全部单词

SELECT DISTINCT tag
FROM word
ORDER BY tag;--查询标签种类

INSERT INTO word (word, tag, pos, meaning, audio, is_collected)
VALUES (
    'medical',
    'disease',                    -- 随便给个标签，可改
    'n.',                      -- 词性
    '医疗',            -- 多义用 | 分隔
    '',  -- 有道英音
    0                          -- 0 未收藏，1 已收藏
);

-- 初始化一条全局记录（指针默认 0，计数默认 0）
INSERT INTO `global_var` (`learning_pointer`, `learning_count`)
VALUES (0, 0);

CREATE TABLE `global_var` (
    `learning_pointer` INT,
    `learning_count`   INT
);

*/



SELECT * from word;