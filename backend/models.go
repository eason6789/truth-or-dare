package main

// CardFace 卡面单道题（正/反面各一）。s/se 为可选替换词，空时省略。
type CardFace struct {
	Q  string `json:"q"`
	QE string `json:"qe"`
	S  string `json:"s,omitempty"`
	SE string `json:"se,omitempty"`
}

// Stick 一张签 = 正反两道不同的题（front=白面，back=红面）。
type Stick struct {
	ID        int64    `json:"id"`
	Edition   string   `json:"edition"`
	SortOrder int      `json:"sort_order"`
	Front     CardFace `json:"front"`
	Back      CardFace `json:"back"`
}
