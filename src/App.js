import { useState, useEffect } from "react";

const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function getNext21Days() {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

function findFirstCommonSlot(slotsA, slotsB) {
  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.date === b.date) {
        const aStart = parseInt(a.from.replace(":", ""));
        const aEnd = parseInt(a.to.replace(":", ""));
        const bStart = parseInt(b.from.replace(":", ""));
        const bEnd = parseInt(b.to.replace(":", ""));
        const overlapStart = Math.max(aStart, bStart);
        const overlapEnd = Math.min(aEnd, bEnd);
        if (overlapEnd > overlapStart) {
          const fmt = (t) => String(Math.floor(t / 100)).padStart(2, "0") + ":" + String(t % 100).padStart(2, "0");
          return { date: a.date, from: fmt(overlapStart), to: fmt(overlapEnd) };
        }
      }
    }
  }
  return null;
}


function HeartBg() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          fontSize: `${Math.random() * 40 + 20}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: 0.04 + Math.random() * 0.04,
          animation: `float ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 4}s infinite alternate`,
          userSelect: "none",
        }}>♥</div>
      ))}
    </div>
  );
}

function ProfileCard({ profile, onLike, liked, isMatch, onSchedule, isSelf }) {
  const genderEmoji = profile.gender === "Nam" ? "👨" : profile.gender === "Nữ" ? "👩" : "🧑";
  return (
    <div style={{
      background: "rgba(255,255,255,0.07)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 20,
      padding: "24px",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(255,80,120,0.2)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {isMatch && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "linear-gradient(135deg, #ff5078, #ff9040)",
          color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "3px 10px", borderRadius: 20, letterSpacing: 1,
        }}>MATCH ✨</div>
      )}
      <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>{genderEmoji}</div>
      <h3 style={{ margin: 0, textAlign: "center", fontSize: 20, fontWeight: 700, color: "#fff" }}>{profile.name}</h3>
      <p style={{ textAlign: "center", margin: "4px 0 8px", color: "#ff9ab0", fontSize: 14 }}>
        {profile.age} tuổi · {profile.gender}
      </p>
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.5, minHeight: 40 }}>
        {profile.bio || <em>Chưa có bio</em>}
      </p>
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 8 }}>{profile.email}</p>
      {!isSelf && (
        <button onClick={() => onLike(profile.id)} style={{
          display: "block", width: "100%", marginTop: 16,
          padding: "10px",
          background: liked ? "linear-gradient(135deg, #ff5078, #ff9040)" : "rgba(255,255,255,0.08)",
          border: liked ? "none" : "1px solid rgba(255,255,255,0.2)",
          borderRadius: 12, color: "#fff", fontSize: 16, cursor: "pointer",
          fontWeight: 700, transition: "all 0.2s",
        }}>
          {liked ? "❤️ Đã Like" : "🤍 Like"}
        </button>
      )}
      {isSelf && (
        <div style={{
          marginTop: 16, padding: "8px", borderRadius: 12,
          background: "rgba(255,255,255,0.05)", textAlign: "center",
          color: "rgba(255,255,255,0.4)", fontSize: 12,
        }}>Đây là profile của bạn</div>
      )}
      {isMatch && onSchedule && (
        <button onClick={() => onSchedule(profile.id)} style={{
          display: "block", width: "100%", marginTop: 10,
          padding: "10px",
          background: "linear-gradient(135deg, #7f5af0, #2cb67d)",
          border: "none", borderRadius: 12, color: "#fff",
          fontSize: 14, cursor: "pointer", fontWeight: 700,
        }}>
          📅 Chọn lịch hẹn
        </button>
      )}
    </div>
  );
}

function ScheduleModal({ matchedUser, currentUser, allSchedules, onSave, onClose }) {
  const days = getNext21Days();
  const [slots, setSlots] = useState(() => {
    const existing = allSchedules[currentUser.id]?.[matchedUser.id] || [];
    return existing.length ? existing : [{ date: days[0], from: "08:00", to: "10:00" }];
  });

  const addSlot = () => setSlots([...slots, { date: days[0], from: "08:00", to: "10:00" }]);
  const removeSlot = (i) => setSlots(slots.filter((_, idx) => idx !== i));
  const updateSlot = (i, field, val) => {
    const updated = [...slots];
    updated[i] = { ...updated[i], [field]: val };
    setSlots(updated);
  };

  const otherSchedule = allSchedules[matchedUser.id]?.[currentUser.id];
  const commonSlot = otherSchedule ? findFirstCommonSlot(slots, otherSchedule) : null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1a1025", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 24, padding: 32, maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto",
      }}>
        <h2 style={{ color: "#fff", margin: "0 0 4px", fontSize: 22 }}>📅 Chọn lịch rảnh</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 24px", fontSize: 14 }}>
          Match với <strong style={{ color: "#ff9ab0" }}>{matchedUser.name}</strong> – chọn thời gian rảnh của bạn trong 3 tuần tới
        </p>

        {slots.map((slot, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.05)", borderRadius: 14,
            padding: 16, marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
          }}>
            <select value={slot.date} onChange={e => updateSlot(i, "date", e.target.value)} style={selectStyle}>
              {days.map(d => <option key={d} value={d}>{formatDate(d)}</option>)}
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="time" value={slot.from} onChange={e => updateSlot(i, "from", e.target.value)} style={inputStyle} />
              <span style={{ color: "rgba(255,255,255,0.4)" }}>→</span>
              <input type="time" value={slot.to} onChange={e => updateSlot(i, "to", e.target.value)} style={inputStyle} />
            </div>
            {slots.length > 1 && (
              <button onClick={() => removeSlot(i)} style={{
                background: "rgba(255,80,80,0.2)", border: "none", borderRadius: 8,
                color: "#ff8080", cursor: "pointer", padding: "6px 10px", fontSize: 14,
              }}>✕</button>
            )}
          </div>
        ))}

        <button onClick={addSlot} style={{
          width: "100%", padding: 10, borderRadius: 12,
          background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, marginBottom: 20,
        }}>+ Thêm khung giờ</button>

        {otherSchedule && (
          <div style={{
            padding: 16, borderRadius: 14, marginBottom: 20,
            background: commonSlot ? "rgba(44,182,125,0.12)" : "rgba(255,80,80,0.08)",
            border: `1px solid ${commonSlot ? "rgba(44,182,125,0.3)" : "rgba(255,80,80,0.2)"}`,
          }}>
            {commonSlot ? (
              <p style={{ margin: 0, color: "#2cb67d", fontWeight: 700, fontSize: 15 }}>
                ✅ Hai bạn có date hẹn vào: {formatDate(commonSlot.date)} lúc {commonSlot.from} – {commonSlot.to}
              </p>
            ) : (
              <p style={{ margin: 0, color: "#ff8080", fontSize: 14 }}>
                😕 Chưa tìm được thời gian trùng. Vui lòng chọn lại.
              </p>
            )}
          </div>
        )}

        {!otherSchedule && (
          <div style={{
            padding: 12, borderRadius: 12, marginBottom: 20,
            background: "rgba(255,164,0,0.08)", border: "1px solid rgba(255,164,0,0.2)",
          }}>
            <p style={{ margin: 0, color: "rgba(255,200,100,0.8)", fontSize: 13 }}>
              ⏳ {matchedUser.name} chưa chọn lịch rảnh. Kết quả sẽ hiện sau khi cả hai đã chọn.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 12, borderRadius: 12,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14,
          }}>Huỷ</button>
          <button onClick={() => onSave(slots)} style={{
            flex: 2, padding: 12, borderRadius: 12,
            background: "linear-gradient(135deg, #ff5078, #ff9040)",
            border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}>Lưu lịch rảnh</button>
        </div>
      </div>
    </div>
  );
}

const selectStyle = {
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, color: "#fff", padding: "6px 10px", fontSize: 13, flex: 1, minWidth: 160,
};
const inputStyle = {
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, color: "#fff", padding: "6px 10px", fontSize: 13,
};

export default function App() {
  const [profiles, setProfiles] = useState(() => store.get("profiles") || []);
  const [likes, setLikes] = useState(() => store.get("likes") || {}); // likes[userId][targetId] = true
  const [schedules, setSchedules] = useState(() => store.get("schedules") || {}); // schedules[userId][matchedId] = slots[]
  const [currentUserId, setCurrentUserId] = useState(() => store.get("currentUserId") || null);
  const [view, setView] = useState("home"); // home | create | browse | schedule
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", age: "", gender: "Nam", bio: "", email: "" });
  const [errors, setErrors] = useState({});
  const [switchEmail, setSwitchEmail] = useState("");
  const [showSwitch, setShowSwitch] = useState(false);

  useEffect(() => { store.set("profiles", profiles); }, [profiles]);
  useEffect(() => { store.set("likes", likes); }, [likes]);
  useEffect(() => { store.set("schedules", schedules); }, [schedules]);
  useEffect(() => { store.set("currentUserId", currentUserId); }, [currentUserId]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentUser = profiles.find(p => p.id === currentUserId);

  const getMatches = (userId) => {
    const userLikes = likes[userId] || {};
    return profiles.filter(p => p.id !== userId && userLikes[p.id] && (likes[p.id] || {})[userId]);
  };

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập tên";
    if (!form.age || isNaN(form.age) || form.age < 18 || form.age > 99) e.age = "Tuổi từ 18–99";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Email không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateProfile = () => {
    if (!validateForm()) return;
    if (profiles.find(p => p.email === form.email)) {
      setErrors({ email: "Email này đã được dùng. Hãy đăng nhập bằng email đó." });
      return;
    }
    const newProfile = { ...form, age: parseInt(form.age), id: generateId() };
    setProfiles([...profiles, newProfile]);
    setCurrentUserId(newProfile.id);
    setView("browse");
    showToast("Profile đã tạo! Bắt đầu khám phá 🎉");
  };

  const handleSwitchUser = () => {
    const found = profiles.find(p => p.email === switchEmail.trim());
    if (!found) { showToast("Không tìm thấy email này", "error"); return; }
    setCurrentUserId(found.id);
    setShowSwitch(false);
    setSwitchEmail("");
    setView("browse");
    showToast(`Chào ${found.name}! 👋`);
  };

  const handleLike = (targetId) => {
    if (!currentUserId) { showToast("Vui lòng tạo profile trước", "error"); return; }
    const newLikes = { ...likes, [currentUserId]: { ...(likes[currentUserId] || {}), [targetId]: true } };
    setLikes(newLikes);
    const targetLikesUs = (newLikes[targetId] || {})[currentUserId];
    const targetProfile = profiles.find(p => p.id === targetId);
    if (targetLikesUs) {
      showToast(`💘 It's a Match với ${targetProfile.name}!`);
    } else {
      showToast(`❤️ Đã like ${targetProfile.name}`);
    }
  };

  const handleSaveSchedule = (slots) => {
    const newSchedules = {
      ...schedules,
      [currentUserId]: { ...(schedules[currentUserId] || {}), [scheduleTarget]: slots },
    };
    setSchedules(newSchedules);
    setScheduleTarget(null);
    showToast("Đã lưu lịch rảnh ✅");
  };

  const inputSt = (err) => ({
    width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 15,
    background: "rgba(255,255,255,0.07)", border: `1px solid ${err ? "#ff5050" : "rgba(255,255,255,0.15)"}`,
    color: "#fff", boxSizing: "border-box", outline: "none",
  });

  const matches = currentUser ? getMatches(currentUserId) : [];
  const nonSelfProfiles = profiles.filter(p => p.id !== currentUserId);
  const userLikes = likes[currentUserId] || {};

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0617 0%, #1a0a2e 40%, #0d1a2e 100%)",
      fontFamily: "'Georgia', serif",
      color: "#fff",
      position: "relative",
    }}>
      <style>{`
        @keyframes float { from { transform: translateY(0px) rotate(0deg); } to { transform: translateY(-20px) rotate(10deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        select option { background: #1a0a2e; }
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <HeartBg />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? "#c0392b" : "linear-gradient(135deg, #ff5078, #ff9040)",
          color: "#fff", padding: "12px 24px", borderRadius: 50, fontWeight: 700,
          zIndex: 200, animation: "slideIn 0.3s ease", boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap", maxWidth: "90vw",
        }}>{toast.msg}</div>
      )}

      {/* Schedule Modal */}
      {scheduleTarget && currentUser && (
        <ScheduleModal
          matchedUser={profiles.find(p => p.id === scheduleTarget)}
          currentUser={currentUser}
          allSchedules={schedules}
          onSave={handleSaveSchedule}
          onClose={() => setScheduleTarget(null)}
        />
      )}

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(13,6,23,0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setView("home")}>
          <span style={{ fontSize: 24 }}>♥</span>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>Clique</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Dating</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {currentUser ? (
            <>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>👤 {currentUser.name}</span>
              <button onClick={() => setView("browse")} style={navBtn(view === "browse")}>Khám phá</button>
              {matches.length > 0 && (
                <button onClick={() => setView("matches")} style={navBtn(view === "matches")}>
                  Matches {matches.length > 0 && <span style={{ background: "#ff5078", borderRadius: 50, padding: "1px 6px", fontSize: 11, marginLeft: 4 }}>{matches.length}</span>}
                </button>
              )}
              <button onClick={() => setShowSwitch(true)} style={{ ...navBtn(false), fontSize: 12 }}>Đổi user</button>
            </>
          ) : (
            <>
              <button onClick={() => setView("create")} style={navBtn(view === "create")}>Tạo profile</button>
              <button onClick={() => setShowSwitch(true)} style={navBtn(false)}>Đăng nhập</button>
            </>
          )}
        </div>
      </nav>

      {/* Switch User Modal */}
      {showSwitch && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowSwitch(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#1a1025", borderRadius: 20, padding: 32,
            width: 340, border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <h3 style={{ margin: "0 0 16px", color: "#fff" }}>Đăng nhập bằng Email</h3>
            <input placeholder="Email của bạn" value={switchEmail}
              onChange={e => setSwitchEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSwitchUser()}
              style={{ ...inputSt(false), marginBottom: 12 }} />
            <button onClick={handleSwitchUser} style={primaryBtn}>Đăng nhập</button>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 1 }}>

        {/* HOME */}
        {view === "home" && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 80, marginBottom: 24, animation: "float 3s ease-in-out infinite alternate" }}>♥</div>
            <h1 style={{ fontSize: 52, fontWeight: 700, margin: "0 0 16px", lineHeight: 1.1 }}>
              Tìm kết nối<br />
              <span style={{ background: "linear-gradient(135deg, #ff5078, #ff9040)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                thật sự ý nghĩa
              </span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
              Tạo profile, like nhau, match và đặt lịch hẹn – tất cả trong một nơi.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setView("create")} style={primaryBtn}>
                Tạo profile ngay →
              </button>
              {profiles.length > 0 && (
                <button onClick={() => setShowSwitch(true)} style={{
                  ...primaryBtn, background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}>Đăng nhập</button>
              )}
            </div>
            {profiles.length > 0 && (
              <p style={{ marginTop: 24, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                {profiles.length} người đã tham gia
              </p>
            )}
          </div>
        )}

        {/* CREATE PROFILE */}
        {view === "create" && (
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", fontSize: 28, marginBottom: 8 }}>Tạo Profile</h2>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>Kể câu chuyện của bạn</p>

            {[
              { key: "name", label: "Tên", placeholder: "Tên của bạn", type: "text" },
              { key: "age", label: "Tuổi", placeholder: "Ví dụ: 22", type: "number" },
              { key: "email", label: "Email", placeholder: "email@example.com", type: "email" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key} style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 6 }}>{label}</label>
                <input type={type} placeholder={placeholder} value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={inputSt(errors[key])} />
                {errors[key] && <p style={{ color: "#ff8080", fontSize: 12, margin: "4px 0 0" }}>{errors[key]}</p>}
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 6 }}>Giới tính</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Nam", "Nữ", "Khác"].map(g => (
                  <button key={g} onClick={() => setForm({ ...form, gender: g })} style={{
                    flex: 1, padding: "10px", borderRadius: 10,
                    background: form.gender === g ? "linear-gradient(135deg, #ff5078, #ff9040)" : "rgba(255,255,255,0.07)",
                    border: form.gender === g ? "none" : "1px solid rgba(255,255,255,0.15)",
                    color: "#fff", cursor: "pointer", fontSize: 14,
                  }}>{g === "Nam" ? "👨 Nam" : g === "Nữ" ? "👩 Nữ" : "🧑 Khác"}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 6 }}>Bio</label>
              <textarea placeholder="Kể một điều thú vị về bạn..." value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                rows={3} style={{ ...inputSt(false), resize: "vertical" }} />
            </div>

            <button onClick={handleCreateProfile} style={primaryBtn}>Tạo Profile →</button>
          </div>
        )}

        {/* BROWSE */}
        {view === "browse" && (
          <div>
            <h2 style={{ textAlign: "center", fontSize: 28, marginBottom: 8 }}>Khám phá</h2>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>
              {nonSelfProfiles.length} người đang chờ bạn
            </p>
            {profiles.length === 0 && (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Chưa có profile nào. Hãy tạo profile đầu tiên!</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {profiles.map(p => {
                const isMatch = currentUser && (likes[currentUserId] || {})[p.id] && (likes[p.id] || {})[currentUserId];
                return (
                  <ProfileCard
                    key={p.id}
                    profile={p}
                    isSelf={p.id === currentUserId}
                    liked={(userLikes)[p.id]}
                    isMatch={isMatch}
                    onLike={handleLike}
                    onSchedule={currentUser ? (id) => setScheduleTarget(id) : null}
                  />
                );
              })}
            </div>
            {!currentUser && profiles.length > 0 && (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>Tạo profile để like và match!</p>
                <button onClick={() => setView("create")} style={primaryBtn}>Tạo profile</button>
              </div>
            )}
          </div>
        )}

        {/* MATCHES */}
        {view === "matches" && (
          <div>
            <h2 style={{ textAlign: "center", fontSize: 28, marginBottom: 8 }}>💘 Matches của bạn</h2>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>
              {matches.length} match đang chờ hẹn
            </p>
            {matches.length === 0 ? (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Chưa có match nào. Hãy tiếp tục like!</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                {matches.map(p => {
                  const mySlots = schedules[currentUserId]?.[p.id];
                  const theirSlots = schedules[p.id]?.[currentUserId];
                  const common = mySlots && theirSlots ? findFirstCommonSlot(mySlots, theirSlots) : null;
                  return (
                    <div key={p.id}>
                      <ProfileCard
                        profile={p} isSelf={false} liked={true} isMatch={true}
                        onLike={() => {}} onSchedule={() => setScheduleTarget(p.id)}
                      />
                      {common && (
                        <div style={{
                          marginTop: 8, padding: "10px 14px", borderRadius: 12,
                          background: "rgba(44,182,125,0.12)", border: "1px solid rgba(44,182,125,0.3)",
                        }}>
                          <p style={{ margin: 0, color: "#2cb67d", fontSize: 13, fontWeight: 700 }}>
                            ✅ Date: {formatDate(common.date)} lúc {common.from}
                          </p>
                        </div>
                      )}
                      {mySlots && !theirSlots && (
                        <div style={{ marginTop: 8, padding: "8px 14px", borderRadius: 12, background: "rgba(255,164,0,0.08)" }}>
                          <p style={{ margin: 0, color: "rgba(255,200,100,0.8)", fontSize: 12 }}>⏳ Chờ {p.name} chọn lịch...</p>
                        </div>
                      )}
                      {!mySlots && (
                        <div style={{ marginTop: 8, padding: "8px 14px", borderRadius: 12, background: "rgba(127,90,240,0.1)" }}>
                          <p style={{ margin: 0, color: "rgba(180,150,255,0.8)", fontSize: 12 }}>📅 Hãy chọn lịch rảnh của bạn!</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const primaryBtn = {
  display: "block", width: "100%", padding: "14px", borderRadius: 14,
  background: "linear-gradient(135deg, #ff5078, #ff9040)",
  border: "none", color: "#fff", fontSize: 16, fontWeight: 700,
  cursor: "pointer", letterSpacing: 0.5,
};

function navBtn(active) {
  return {
    padding: "6px 14px", borderRadius: 20, fontSize: 13,
    background: active ? "rgba(255,80,120,0.2)" : "transparent",
    border: active ? "1px solid rgba(255,80,120,0.4)" : "1px solid transparent",
    color: active ? "#ff9ab0" : "rgba(255,255,255,0.6)",
    cursor: "pointer",
  };
}
