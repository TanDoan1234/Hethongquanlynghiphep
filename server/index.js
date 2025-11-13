const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// Load .env from root directory
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const supabase = require("./supabaseClient");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Authentication middleware - sử dụng Supabase Auth
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    // Verify token với Supabase Auth
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Lấy profile để có role
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: profile.username,
      role: profile.role,
      name: profile.name,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(403).json({ error: "Authentication failed" });
  }
}

// Check if user is manager
function isManager(req, res, next) {
  if (req.user.role !== "manager") {
    return res.status(403).json({ error: "Manager access required" });
  }
  next();
}

// Routes

// Login - Sử dụng Supabase Auth
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tìm user profile theo username để lấy email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, name, email, role")
      .eq("username", username)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Đăng nhập với Supabase Auth sử dụng email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: profile.email || `${username}@company.com`,
      password: password,
    });

    if (error) {
      console.error("Login error:", error);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({
      token: data.session.access_token,
      user: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        role: profile.role,
        email: profile.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, username, name, role, email")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(profile);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create employee account (Manager only) - Sử dụng Supabase Auth
app.post("/api/users", authenticateToken, isManager, async (req, res) => {
  try {
    const { username, password, name, email } = req.body;

    if (!username || !password || !name) {
      return res
        .status(400)
        .json({ error: "Tên đăng nhập, mật khẩu và họ tên là bắt buộc" });
    }

    // Check if username already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (existingProfile) {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
    }

    const userEmail = email || `${username}@company.com`;

    // Tạo user trong Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: userEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          username: username,
          name: name,
          role: "employee",
        },
      });

    if (authError) {
      console.error("Create user error:", authError);
      return res
        .status(500)
        .json({ error: "Lỗi khi tạo tài khoản: " + authError.message });
    }

    // Profile sẽ tự động được tạo qua trigger
    // Đợi một chút để trigger chạy
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Lấy profile vừa tạo
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("id, username, name, email, role")
      .eq("id", authData.user.id)
      .single();

    res.status(201).json(newProfile);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Bulk create employees (Manager only)
app.post(
  "/api/users/bulk-setup",
  authenticateToken,
  isManager,
  async (req, res) => {
    try {
      // Remove employee named "Vũ" or username contains "vu"
      const { data: vuProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "employee")
        .or("name.ilike.%vũ%,username.ilike.%vu%");

      if (vuProfiles && vuProfiles.length > 0) {
        for (const profile of vuProfiles) {
          await supabase.auth.admin.deleteUser(profile.id);
        }
      }

      // List of employees to add
      const employeeList = [
        { name: "A.NĂM", username: "anam" },
        { name: "TIẾN", username: "tien" },
        { name: "HIỆP", username: "hiep" },
        { name: "CHƯƠNG", username: "chuong" },
        { name: "PHƯỚC", username: "phuoc" },
        { name: "GIANG", username: "giang" },
        { name: "HÒA", username: "hoa" },
        { name: "DUY", username: "duy" },
        { name: "THƯƠNG", username: "thuong" },
        { name: "ANH THÁI", username: "anhthai" },
        { name: "C.HƯỜNG", username: "chuongc" },
        { name: "TÚ", username: "tu" },
        { name: "LUẬT", username: "luat" },
        { name: "C.NHIỄM", username: "cnhiem" },
        { name: "VY", username: "vy" },
        { name: "THẾ ANH", username: "theanh" },
        { name: "HẬU", username: "hau" },
      ];

      const addedUsers = [];

      for (const emp of employeeList) {
        // Check if username already exists
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", emp.username)
          .single();

        if (!existing) {
          try {
            const { data: authData } = await supabase.auth.admin.createUser({
              email: `${emp.username}@company.com`,
              password: "123456",
              email_confirm: true,
              user_metadata: {
                username: emp.username,
                name: emp.name,
                role: "employee",
              },
            });

            if (authData) {
              addedUsers.push({
                id: authData.user.id,
                username: emp.username,
                name: emp.name,
                role: "employee",
              });
            }
          } catch (err) {
            console.error(`Error creating ${emp.username}:`, err);
          }
        }
      }

      res.json({
        message: `Đã xóa nhân viên Vũ và thêm ${addedUsers.length} nhân viên mới`,
        added: addedUsers,
      });
    } catch (err) {
      console.error("Bulk setup error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all users (Manager only)
app.get("/api/users", authenticateToken, isManager, async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username, name, email, role")
      .order("username", { ascending: true });

    if (error) {
      console.error("Get users error:", error);
      return res
        .status(500)
        .json({ error: "Lỗi khi lấy danh sách người dùng" });
    }

    res.json(profiles);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user (Manager only)
app.put("/api/users/:id", authenticateToken, isManager, async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, username } = req.body;

    // Check if username already exists (excluding current user)
    if (username) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", userId)
        .single();

      if (existingProfile) {
        return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("id, username, name, email, role")
      .single();

    if (error || !updatedProfile) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên" });
    }

    res.json(updatedProfile);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change password (Employee/Manager) - Sử dụng Supabase Auth
app.patch("/api/users/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    // Verify current password by attempting to sign in
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", req.user.id)
      .single();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (updateError) {
      return res.status(500).json({ error: "Lỗi khi đổi mật khẩu" });
    }

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password for employee (Manager only)
app.patch(
  "/api/users/:id/reset-password",
  authenticateToken,
  isManager,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { newPassword } = req.body;

      const password = newPassword || "123456";

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: password,
      });

      if (error) {
        return res.status(404).json({ error: "Không tìm thấy nhân viên" });
      }

      res.json({
        message: "Đặt lại mật khẩu thành công",
        defaultPassword: password,
      });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get own salary for employee
app.get("/api/users/me/salary/:month", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.params.month;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("salaries")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    const salary =
      profile.salaries && profile.salaries[month]
        ? profile.salaries[month]
        : null;

    res.json({ month, salary });
  } catch (err) {
    console.error("Get salary error:", err);
    res.status(500).json({ error: "Lỗi khi lấy thông tin lương" });
  }
});

// Set salary for employee (Manager only)
app.post(
  "/api/users/:id/salary",
  authenticateToken,
  isManager,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { month, salary } = req.body;

      if (!month || salary === undefined || salary === null) {
        return res.status(400).json({ error: "Tháng và lương là bắt buộc" });
      }

      if (salary < 0) {
        return res.status(400).json({ error: "Lương không thể âm" });
      }

      // Get current salaries
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("salaries")
        .eq("id", userId)
        .single();

      if (fetchError || !profile) {
        return res.status(404).json({ error: "Không tìm thấy nhân viên" });
      }

      const salaries = profile.salaries || {};
      salaries[month] = parseFloat(salary);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ salaries })
        .eq("id", userId);

      if (updateError) {
        return res.status(500).json({ error: "Lỗi khi đặt lương" });
      }

      res.json({
        message: "Đặt lương thành công",
        month,
        salary: salaries[month],
      });
    } catch (err) {
      console.error("Set salary error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get salary for employee (Manager only)
app.get(
  "/api/users/:id/salary/:month",
  authenticateToken,
  isManager,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const month = req.params.month;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("salaries")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        return res.status(404).json({ error: "Không tìm thấy nhân viên" });
      }

      const salary =
        profile.salaries && profile.salaries[month]
          ? profile.salaries[month]
          : null;

      res.json({ month, salary });
    } catch (err) {
      console.error("Get salary error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all salaries for employee (Manager only)
app.get(
  "/api/users/:id/salaries",
  authenticateToken,
  isManager,
  async (req, res) => {
    try {
      const userId = req.params.id;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("salaries")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        return res.status(404).json({ error: "Không tìm thấy nhân viên" });
      }

      res.json({ salaries: profile.salaries || {} });
    } catch (err) {
      console.error("Get salaries error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete user (Manager only)
app.delete("/api/users/:id", authenticateToken, isManager, async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user.id) {
      return res
        .status(400)
        .json({ error: "Không thể xóa tài khoản của chính bạn" });
    }

    // Xóa user từ Supabase Auth (sẽ cascade delete profile)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ error: "Lỗi khi xóa nhân viên" });
    }

    res.json({ message: "Xóa nhân viên thành công" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit leave request
app.post("/api/leave-requests", authenticateToken, async (req, res) => {
  try {
    const {
      date,
      startDate,
      endDate,
      reason,
      type,
      timePeriod,
      startTimePeriod,
      endTimePeriod,
      userId,
    } = req.body;

    // New simplified format
    if (date !== undefined && date !== null) {
      if (!date || date.trim() === "") {
        return res.status(400).json({ error: "Ngày nghỉ là bắt buộc" });
      }

      let targetUserId = req.user.id;
      let targetUserName = req.user.name;

      // Manager can create for other employees
      if (req.user.role === "manager" && userId) {
        const { data: targetProfile } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("id", userId)
          .eq("role", "employee")
          .single();

        if (!targetProfile) {
          return res.status(400).json({ error: "Không tìm thấy nhân viên" });
        }
        targetUserId = userId;
        targetUserName = targetProfile.name;
      }

      const { data: newRequest, error } = await supabase
        .from("leave_requests")
        .insert([
          {
            user_id: targetUserId,
            user_name: targetUserName,
            date,
            time_period: timePeriod || "cả ngày",
            reason: reason || "",
            status: req.user.role === "manager" ? "approved" : "pending",
            can_edit: req.user.role === "manager" ? false : true,
            created_by_manager:
              req.user.role === "manager" && userId ? true : false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Create leave request error:", error);
        return res.status(500).json({ error: "Lỗi khi tạo đơn nghỉ phép" });
      }

      return res.status(201).json({
        id: newRequest.id,
        userId: newRequest.user_id,
        userName: newRequest.user_name,
        date: newRequest.date,
        timePeriod: newRequest.time_period,
        reason: newRequest.reason,
        status: newRequest.status,
        submittedAt: newRequest.submitted_at,
        canEdit: newRequest.can_edit,
        createdByManager: newRequest.created_by_manager,
      });
    }

    // Old format (backward compatibility)
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Ngày bắt đầu và ngày kết thúc là bắt buộc" });
    }

    const { data: newRequest, error } = await supabase
      .from("leave_requests")
      .insert([
        {
          user_id: req.user.id,
          user_name: req.user.name,
          start_date: startDate,
          end_date: endDate,
          start_time_period: startTimePeriod || "cả ngày",
          end_time_period: endTimePeriod || "cả ngày",
          reason: reason || "",
          type: type || "nghỉ phép",
          status: req.user.role === "manager" ? "approved" : "pending",
          can_edit: req.user.role === "manager" ? false : true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Create leave request error:", error);
      return res.status(500).json({ error: "Lỗi khi tạo đơn nghỉ phép" });
    }

    res.status(201).json({
      id: newRequest.id,
      userId: newRequest.user_id,
      userName: newRequest.user_name,
      startDate: newRequest.start_date,
      endDate: newRequest.end_date,
      startTimePeriod: newRequest.start_time_period,
      endTimePeriod: newRequest.end_time_period,
      reason: newRequest.reason,
      type: newRequest.type,
      status: newRequest.status,
      submittedAt: newRequest.submitted_at,
      canEdit: newRequest.can_edit,
    });
  } catch (err) {
    console.error("Create leave request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get leave requests
app.get("/api/leave-requests", authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from("leave_requests")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (req.user.role !== "manager") {
      // Employee can only see their own requests
      query = query.eq("user_id", req.user.id);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Get leave requests error:", error);
      return res
        .status(500)
        .json({ error: "Lỗi khi lấy danh sách đơn nghỉ phép" });
    }

    // Convert snake_case to camelCase for frontend
    const formattedRequests = requests.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      date: r.date,
      startDate: r.start_date,
      endDate: r.end_date,
      timePeriod: r.time_period,
      startTimePeriod: r.start_time_period,
      endTimePeriod: r.end_time_period,
      reason: r.reason,
      type: r.type,
      status: r.status,
      canEdit: r.can_edit,
      createdByManager: r.created_by_manager,
      submittedAt: r.submitted_at,
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error("Get leave requests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single leave request
app.get("/api/leave-requests/:id", authenticateToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    const { data: request, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error || !request) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    // Check permission
    if (req.user.role !== "manager" && request.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      id: request.id,
      userId: request.user_id,
      userName: request.user_name,
      date: request.date,
      startDate: request.start_date,
      endDate: request.end_date,
      timePeriod: request.time_period,
      startTimePeriod: request.start_time_period,
      endTimePeriod: request.end_time_period,
      reason: request.reason,
      type: request.type,
      status: request.status,
      canEdit: request.can_edit,
      createdByManager: request.created_by_manager,
      submittedAt: request.submitted_at,
    });
  } catch (err) {
    console.error("Get leave request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update leave request (Manager only)
app.put("/api/leave-requests/:id", authenticateToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    if (req.user.role !== "manager") {
      return res
        .status(403)
        .json({ error: "Chỉ quản lý mới có quyền chỉnh sửa đơn nghỉ phép" });
    }

    const {
      date,
      startDate,
      endDate,
      reason,
      type,
      timePeriod,
      startTimePeriod,
      endTimePeriod,
    } = req.body;

    const updateData = {};

    if (date !== undefined) {
      updateData.date = date;
      if (timePeriod !== undefined) updateData.time_period = timePeriod;
      if (reason !== undefined) updateData.reason = reason;
    } else {
      if (startDate !== undefined) updateData.start_date = startDate;
      if (endDate !== undefined) updateData.end_date = endDate;
      if (startTimePeriod !== undefined)
        updateData.start_time_period = startTimePeriod;
      if (endTimePeriod !== undefined)
        updateData.end_time_period = endTimePeriod;
      if (reason !== undefined) updateData.reason = reason;
      if (type !== undefined) updateData.type = type;
    }

    const { data: updatedRequest, error } = await supabase
      .from("leave_requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single();

    if (error || !updatedRequest) {
      return res.status(404).json({ error: "Không tìm thấy đơn nghỉ phép" });
    }

    res.json({
      id: updatedRequest.id,
      userId: updatedRequest.user_id,
      userName: updatedRequest.user_name,
      date: updatedRequest.date,
      startDate: updatedRequest.start_date,
      endDate: updatedRequest.end_date,
      timePeriod: updatedRequest.time_period,
      startTimePeriod: updatedRequest.start_time_period,
      endTimePeriod: updatedRequest.end_time_period,
      reason: updatedRequest.reason,
      type: updatedRequest.type,
      status: updatedRequest.status,
      canEdit: updatedRequest.can_edit,
      submittedAt: updatedRequest.submitted_at,
    });
  } catch (err) {
    console.error("Update leave request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Approve/Reject leave request (Manager only)
app.patch(
  "/api/leave-requests/:id/status",
  authenticateToken,
  isManager,
  async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const { data: updatedRequest, error } = await supabase
        .from("leave_requests")
        .update({ status, can_edit: false })
        .eq("id", requestId)
        .select()
        .single();

      if (error || !updatedRequest) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      res.json({
        id: updatedRequest.id,
        userId: updatedRequest.user_id,
        userName: updatedRequest.user_name,
        date: updatedRequest.date,
        startDate: updatedRequest.start_date,
        endDate: updatedRequest.end_date,
        timePeriod: updatedRequest.time_period,
        startTimePeriod: updatedRequest.start_time_period,
        endTimePeriod: updatedRequest.end_time_period,
        reason: updatedRequest.reason,
        type: updatedRequest.type,
        status: updatedRequest.status,
        canEdit: updatedRequest.can_edit,
        submittedAt: updatedRequest.submitted_at,
      });
    } catch (err) {
      console.error("Update status error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete leave request (Manager only)
app.delete("/api/leave-requests/:id", authenticateToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    if (req.user.role !== "manager") {
      return res
        .status(403)
        .json({ error: "Chỉ quản lý mới có quyền xóa đơn nghỉ phép" });
    }

    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      console.error("Delete leave request error:", error);
      return res.status(500).json({ error: "Lỗi khi xóa đơn nghỉ phép" });
    }

    res.json({ message: "Xóa đơn nghỉ phép thành công" });
  } catch (err) {
    console.error("Delete leave request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create advance salary request
app.post("/api/advance-requests", authenticateToken, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: "Số tiền là bắt buộc" });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Số tiền phải lớn hơn 0" });
    }

    let targetUserId = req.user.id;
    let targetUserName = req.user.name;

    if (req.user.role === "manager") {
      if (!userId) {
        return res.status(400).json({ error: "Nhân viên là bắt buộc" });
      }

      const { data: employee, error: empError } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", userId)
        .eq("role", "employee")
        .single();

      if (empError || !employee) {
        return res.status(404).json({ error: "Không tìm thấy nhân viên" });
      }

      targetUserId = userId;
      targetUserName = employee.name;
    }

    const { data: newRequest, error } = await supabase
      .from("advance_requests")
      .insert([
        {
          user_id: targetUserId,
          user_name: targetUserName,
          amount: parsedAmount,
          reason: (reason || "").trim(),
          status: req.user.role === "manager" ? "approved" : "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Create advance request error:", error);
      return res.status(500).json({ error: "Lỗi khi tạo yêu cầu ứng lương" });
    }

    res.status(201).json({
      id: newRequest.id,
      userId: newRequest.user_id,
      userName: newRequest.user_name,
      amount: newRequest.amount,
      reason: newRequest.reason,
      status: newRequest.status,
      submittedAt: newRequest.submitted_at,
    });
  } catch (err) {
    console.error("Create advance request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get advance requests
app.get("/api/advance-requests", authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from("advance_requests")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (req.user.role !== "manager") {
      query = query.eq("user_id", req.user.id);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Get advance requests error:", error);
      return res.status(500).json({ error: "Lỗi khi lấy danh sách ứng lương" });
    }

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      amount: r.amount,
      reason: r.reason,
      status: r.status,
      submittedAt: r.submitted_at,
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error("Get advance requests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Approve/Reject advance request (Manager only)
app.patch(
  "/api/advance-requests/:id/status",
  authenticateToken,
  isManager,
  async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Trạng thái không hợp lệ" });
      }

      const { data: updatedRequest, error } = await supabase
        .from("advance_requests")
        .update({ status })
        .eq("id", requestId)
        .select()
        .single();

      if (error || !updatedRequest) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy yêu cầu ứng lương" });
      }

      res.json({
        id: updatedRequest.id,
        userId: updatedRequest.user_id,
        userName: updatedRequest.user_name,
        amount: updatedRequest.amount,
        reason: updatedRequest.reason,
        status: updatedRequest.status,
        submittedAt: updatedRequest.submitted_at,
      });
    } catch (err) {
      console.error("Update advance request status error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update advance request (Manager only)
app.put(
  "/api/advance-requests/:id",
  authenticateToken,
  isManager,
  async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { amount, reason } = req.body;

      if (amount === undefined || amount === null) {
        return res.status(400).json({ error: "Số tiền là bắt buộc" });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Số tiền phải lớn hơn 0" });
      }

      const { data: updatedRequest, error } = await supabase
        .from("advance_requests")
        .update({
          amount: parsedAmount,
          reason: (reason || "").trim(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error || !updatedRequest) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy yêu cầu ứng lương" });
      }

      res.json({
        id: updatedRequest.id,
        userId: updatedRequest.user_id,
        userName: updatedRequest.user_name,
        amount: updatedRequest.amount,
        reason: updatedRequest.reason,
        status: updatedRequest.status,
        submittedAt: updatedRequest.submitted_at,
      });
    } catch (err) {
      console.error("Update advance request error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete advance request (Manager only)
app.delete(
  "/api/advance-requests/:id",
  authenticateToken,
  isManager,
  async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);

      const { error } = await supabase
        .from("advance_requests")
        .delete()
        .eq("id", requestId);

      if (error) {
        console.error("Delete advance request error:", error);
        return res.status(500).json({ error: "Lỗi khi xóa yêu cầu ứng lương" });
      }

      res.json({ message: "Xóa yêu cầu ứng lương thành công" });
    } catch (err) {
      console.error("Delete advance request error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔐 Using Supabase Auth for authentication`);
  console.log(`📊 Database: Supabase`);
});
