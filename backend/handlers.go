package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

const sticksColumns = `id, edition, sort_order,
	front_q, front_qe, COALESCE(front_s,''), COALESCE(front_se,''),
	back_q, back_qe, COALESCE(back_s,''), COALESCE(back_se,'')`

func scanStick(row interface{ Scan(...interface{}) error }) (Stick, error) {
	var s Stick
	err := row.Scan(&s.ID, &s.Edition, &s.SortOrder,
		&s.Front.Q, &s.Front.QE, &s.Front.S, &s.Front.SE,
		&s.Back.Q, &s.Back.QE, &s.Back.S, &s.Back.SE)
	return s, err
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	jsonResp(w, true, "truth-or-dare backend ok", map[string]string{
		"service": "truth-or-dare",
		"env":     cfg.Env,
	})
}

func handleListSticks(w http.ResponseWriter, r *http.Request) {
	edition := r.URL.Query().Get("edition")
	if edition == "" {
		edition = "couple"
	}

	rows, err := db.Query(`SELECT `+sticksColumns+` FROM sticks WHERE edition = ? ORDER BY sort_order ASC, id ASC`, edition)
	if err != nil {
		logger.Printf("查询失败: %v", err)
		jsonResp(w, false, "查询失败", nil)
		return
	}
	defer rows.Close()

	sticks := []Stick{}
	for rows.Next() {
		s, err := scanStick(rows)
		if err != nil {
			logger.Printf("扫描失败: %v", err)
			jsonResp(w, false, "扫描失败", nil)
			return
		}
		sticks = append(sticks, s)
	}
	jsonResp(w, true, "ok", sticks)
}

func handleCreateStick(w http.ResponseWriter, r *http.Request) {
	var s Stick
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		jsonResp(w, false, "请求体解析失败", nil)
		return
	}
	if strings.TrimSpace(s.Front.Q) == "" && strings.TrimSpace(s.Back.Q) == "" {
		jsonResp(w, false, "正反面题目不能都为空", nil)
		return
	}
	if s.Edition == "" {
		s.Edition = "couple"
	}

	res, err := db.Exec(`INSERT INTO sticks
		(edition, sort_order, front_q, front_qe, front_s, front_se, back_q, back_qe, back_s, back_se)
		VALUES (?,?,?,?,?,?,?,?,?,?)`,
		s.Edition, s.SortOrder, s.Front.Q, s.Front.QE, s.Front.S, s.Front.SE,
		s.Back.Q, s.Back.QE, s.Back.S, s.Back.SE)
	if err != nil {
		logger.Printf("创建失败: %v", err)
		jsonResp(w, false, "创建失败", nil)
		return
	}
	id, _ := res.LastInsertId()
	s.ID = id
	jsonResp(w, true, "创建成功", s)
}

func handleUpdateStick(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		jsonResp(w, false, "无效 id", nil)
		return
	}
	var s Stick
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		jsonResp(w, false, "请求体解析失败", nil)
		return
	}
	if s.Edition == "" {
		s.Edition = "couple"
	}

	if _, err := db.Exec(`UPDATE sticks SET
		edition=?, sort_order=?, front_q=?, front_qe=?, front_s=?, front_se=?, back_q=?, back_qe=?, back_s=?, back_se=?
		WHERE id=?`,
		s.Edition, s.SortOrder, s.Front.Q, s.Front.QE, s.Front.S, s.Front.SE,
		s.Back.Q, s.Back.QE, s.Back.S, s.Back.SE, id); err != nil {
		logger.Printf("更新失败: %v", err)
		jsonResp(w, false, "更新失败", nil)
		return
	}
	s.ID = id
	jsonResp(w, true, "更新成功", s)
}

func handleDeleteStick(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		jsonResp(w, false, "无效 id", nil)
		return
	}
	if _, err := db.Exec(`DELETE FROM sticks WHERE id=?`, id); err != nil {
		logger.Printf("删除失败: %v", err)
		jsonResp(w, false, "删除失败", nil)
		return
	}
	jsonResp(w, true, "删除成功", nil)
}
