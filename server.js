#!/usr/bin/env node
'use strict';

var http = require('http');
var https = require('https');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var url = require('url');

var PORT_USER = parseInt(process.env.PORT_USER || '3210', 10);
var PORT_ADMIN = parseInt(process.env.PORT_ADMIN || '3211', 10);
var DATA_DIR = path.join(__dirname, 'server-data');
var USERS_FILE = path.join(DATA_DIR, 'users.json');
var ANON_FILE = path.join(DATA_DIR, 'anon.json');
var EXAMS_FILE = path.join(DATA_DIR, 'exams.json');
var JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
var REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
var ADMISSION_FILE = path.join(DATA_DIR, 'admission.json');

var ADMIN_EMAIL = '2815097621@qq.com';

function loadEnvFile() {
  try {
    var envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line || line.charAt(0) === '#') return;
      var idx = line.indexOf('=');
      if (idx < 0) return;
      var k = line.slice(0, idx).trim();
      var v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (k && process.env[k] === undefined) process.env[k] = v;
    });
  } catch (e) {}
}
loadEnvFile();

var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
var ADMIN_PWD_FROM_ENV = !!ADMIN_PASSWORD;
if (!ADMIN_PWD_FROM_ENV) {
  ADMIN_PASSWORD = 'bangbanglin-local-dev';
  console.warn('[帮帮林] 警告：未配置 ADMIN_PASSWORD，已使用本地开发占位密码。');
  console.warn('[帮帮林] 请复制 .env.example 为 .env 并填入真实密码后重启。');
}

var EXAMS_SOURCE = process.env.EXAMS_SOURCE || '';
var JOBS_SOURCE = process.env.JOBS_SOURCE || '';
var OFFICIAL_PORTAL = process.env.OFFICIAL_PORTAL || 'https://yz.chsi.com.cn';
var DEMO_SYNC = (process.env.DEMO_SYNC || 'true').toLowerCase() === 'true';
var ADMISSION_SOURCE = process.env.ADMISSION_SOURCE || '';
var ADMISSION_TTL = parseInt(process.env.ADMISSION_TTL || '7', 10) * 24 * 3600 * 1000;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function touch(p, def) {
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def, null, 2));
}
touch(USERS_FILE, { users: {} });
touch(ANON_FILE, { reports: [] });
touch(EXAMS_FILE, { lastUpdated: new Date().toISOString(), items: [] });
touch(JOBS_FILE, { lastUpdated: new Date().toISOString(), items: [] });
touch(REPORTS_FILE, { items: [] });
touch(ADMISSION_FILE, { updatedAt: null, source: '', sourceUrl: OFFICIAL_PORTAL, items: {} });

var SEED_EXAMS = {
  lastUpdated: new Date().toISOString(),
  items: [
    { id: 'ex-408-2024-ds', subject: '408', year: 2024, title: '408 数据结构：删除单链表中所有值为 x 的结点（O(n) 时间）', source: '408 统考真题回忆版', sourceUrl: 'https://yz.chsi.com.cn', officialCheckUrl: 'https://yz.chsi.com.cn/kyzx/zyk/04/', content: '思路：双指针一个前驱 pre 跟随，遇 val==x 则 pre.next=p.next，否则 pre=p。', addedAt: new Date().toISOString() },
    { id: 'ex-408-2023-os', subject: '408', year: 2023, title: '408 操作系统：分页存储管理 TLB 命中率与有效访问时间', source: '408 统考真题回忆版', sourceUrl: 'https://yz.chsi.com.cn', officialCheckUrl: 'https://yz.chsi.com.cn/kyzx/zyk/05/', content: '设 TLB 命中 90%，EAT=0.9*(20+100)+0.1*(20+100+100)。', addedAt: new Date().toISOString() },
    { id: 'ex-pol-2025', subject: '政治', year: 2025, title: '考研政治冲刺：新发展理念科学内涵', source: '考前冲刺手册', sourceUrl: 'https://yz.chsi.com.cn', officialCheckUrl: 'https://yz.chsi.com.cn/sch/list?schId=0&ykcId=101', content: '创新·协调·绿色·开放·共享（五大发展理念）。', addedAt: new Date().toISOString() },
    { id: 'ex-eng-2024', subject: '英语', year: 2024, title: '考研英语一 2024 阅读 Text 2 主旨题', source: '2024 考研英语一真题', sourceUrl: 'https://yz.chsi.com.cn', officialCheckUrl: 'https://yz.chsi.com.cn/sch/list?schId=0&ykcId=201', content: '定位转折词后观点，排除细节干扰。', addedAt: new Date().toISOString() },
    { id: 'ex-kaoyan-shufe', subject: '408', year: 2026, title: '新增·计算机考研 408 程序设计题综合题模板', source: '官方参考教材', sourceUrl: 'https://yz.chsi.com.cn', officialCheckUrl: 'https://yz.chsi.com.cn/kyzx/zyk/04/', content: '常考题型：链表反转、二叉树遍历、图最短路径。', addedAt: new Date().toISOString() }
  ]
};

var SEED_JOBS = {
  lastUpdated: new Date().toISOString(),
  items: [
    { id: 'job-2026-tencent', company: '腾讯', role: '2027 校招·后台开发', city: '深圳/北京/上海', major: '计算机/软件', degree: '本科及以上', url: 'https://careers.tencent.com/', deadline: '2026-10-31', tag: '大厂·Top', sourceUrl: 'https://careers.tencent.com', officialCheckUrl: 'https://www.nowcoder.com/job/', addedAt: new Date().toISOString() },
    { id: 'job-2026-alibaba', company: '阿里巴巴', role: '2027 暑期实习·算法', city: '杭州/北京', major: '计算机/AI', degree: '本科及以上', url: 'https://talent.alibaba.com/', deadline: '2026-09-30', tag: '大厂·高薪', sourceUrl: 'https://talent.alibaba.com', officialCheckUrl: 'https://www.nowcoder.com/job/', addedAt: new Date().toISOString() },
    { id: 'job-2026-icbc', company: '工商银行(软开)', role: '2027 校招·信息技术岗', city: '珠海/多地', major: '计算机/电子', degree: '本科及以上', url: 'https://job.icbc.com.cn/', deadline: '2026-11-15', tag: '银行·稳定', sourceUrl: 'https://job.icbc.com.cn', officialCheckUrl: 'https://www.nowcoder.com/job/', addedAt: new Date().toISOString() },
    { id: 'job-2026-mihoyo', company: '米哈游', role: '2027 校招·游戏客户端', city: '上海', major: '计算机/图形', degree: '本科及以上', url: 'https://campus.mihoyo.com/', deadline: '2026-10-20', tag: '游戏·高薪', sourceUrl: 'https://campus.mihoyo.com', officialCheckUrl: 'https://www.nowcoder.com/job/', addedAt: new Date().toISOString() },
    { id: 'job-2026-bytedance', company: '字节跳动', role: '2027 校招·前端/客户端', city: '北京/杭州', major: '计算机/前端', degree: '本科及以上', url: 'https://jobs.bytedance.com/', deadline: '2026-10-15', tag: '大厂·Top', sourceUrl: 'https://jobs.bytedance.com', officialCheckUrl: 'https://www.nowcoder.com/job/', addedAt: new Date().toISOString() }
  ]
};

if (fs.readFileSync(EXAMS_FILE, 'utf8').length < 10) fs.writeFileSync(EXAMS_FILE, JSON.stringify(SEED_EXAMS, null, 2));
if (fs.readFileSync(JOBS_FILE, 'utf8').length < 10) fs.writeFileSync(JOBS_FILE, JSON.stringify(SEED_JOBS, null, 2));

function rJson(p, def) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return def; } }
function wJson(p, o) { fs.writeFileSync(p, JSON.stringify(o, null, 2)); }

var readUsers = function () { return rJson(USERS_FILE, { users: {} }); };
var writeUsers = function (d) { wJson(USERS_FILE, d); };
var readAnon = function () { return rJson(ANON_FILE, { reports: [] }); };
var writeAnon = function (d) { wJson(ANON_FILE, d); };
var readExams = function () { return rJson(EXAMS_FILE, { lastUpdated: new Date().toISOString(), items: [] }); };
var writeExams = function (d) { wJson(EXAMS_FILE, d); };
var readJobs = function () { return rJson(JOBS_FILE, { lastUpdated: new Date().toISOString(), items: [] }); };
var writeJobs = function (d) { wJson(JOBS_FILE, d); };
var readReports = function () { return rJson(REPORTS_FILE, { items: [] }); };
var writeReports = function (d) { wJson(REPORTS_FILE, d); };
var readAdmission = function () { return rJson(ADMISSION_FILE, { updatedAt: null, source: '', sourceUrl: OFFICIAL_PORTAL, items: {} }); };
var writeAdmission = function (d) { wJson(ADMISSION_FILE, d); };

function admissionAge(adm) {
  if (!adm || !adm.updatedAt) return Infinity;
  return Date.now() - new Date(adm.updatedAt).getTime();
}

function pullAdmissionFromSource() {
  return new Promise(function (resolve, reject) {
    if (!ADMISSION_SOURCE) return reject(new Error('no source'));
    fetchJson(ADMISSION_SOURCE, 12000).then(function (data) {
      if (!data || typeof data !== 'object') return reject(new Error('bad payload'));
      var items = (data && data.items && typeof data.items === 'object') ? data.items : data;
      var adm = readAdmission();
      adm.updatedAt = new Date().toISOString();
      adm.source = data.source || '外部数据源 ' + ADMISSION_SOURCE;
      adm.sourceUrl = data.sourceUrl || ADMISSION_SOURCE;
      adm.items = items;
      writeAdmission(adm);
      resolve(adm);
    }).catch(reject);
  });
}

function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  var hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash: hash, salt: salt };
}

function verifyPassword(password, hash, salt) {
  return hashPassword(password, salt).hash === hash;
}

function generateToken(email) {
  return crypto.createHash('sha256').update(email + ':' + Date.now() + ':' + Math.random()).digest('hex');
}

var CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function parseBody(req) {
  return new Promise(function (resolve) {
    var body = '';
    req.on('data', function (c) { body += c; });
    req.on('end', function () {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); }
    });
  });
}

function adminAuth(parsed, body) {
  var pwd = (parsed.query && parsed.query.pwd) || (body && body.pwd);
  if (pwd === ADMIN_PASSWORD) {
    var s = readUsers();
    return s.users[ADMIN_EMAIL] ? s.users[ADMIN_EMAIL] : { email: ADMIN_EMAIL, isAdmin: true };
  }
  var token = (body && body.token) || (parsed.query && parsed.query.token);
  if (token) {
    var store = readUsers();
    var keys = Object.keys(store.users);
    for (var i = 0; i < keys.length; i++) {
      var u = store.users[keys[i]];
      if (u.token === token && u.isAdmin) return u;
    }
  }
  return null;
}

function computeStats() {
  var anon = readAnon();
  var reports = anon.reports || [];
  var byTargetSchool = {}, byMajorCode = {}, byExamYear = {}, byPath = {};
  var seen = {}, unique = 0;
  reports.forEach(function (r) {
    var d = (r.data && typeof r.data === 'object') ? r.data : {};
    var key = d.uid || (r.time + '|' + (d.targetSchool || '') + '|' + (d.majorCode || ''));
    if (seen[key]) return;
    seen[key] = true;
    unique++;
    if (d.targetSchool) { var s = String(d.targetSchool).trim(); if (s) byTargetSchool[s] = (byTargetSchool[s] || 0) + 1; }
    if (d.majorCode) { var m = String(d.majorCode).trim(); if (m) byMajorCode[m] = (byMajorCode[m] || 0) + 1; }
    if (d.examYear) { var y = String(d.examYear).trim(); if (y) byExamYear[y] = (byExamYear[y] || 0) + 1; }
    if (Array.isArray(d.paths)) d.paths.forEach(function (p) { byPath[p] = (byPath[p] || 0) + 1; });
  });
  function top(o, n) {
    return Object.keys(o).map(function (k) { return { key: k, count: o[k] }; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, n || 10);
  }
  return {
    total: unique,
    rawCount: reports.length,
    byTargetSchool: top(byTargetSchool, 15),
    byMajorCode: top(byMajorCode, 15),
    byExamYear: top(byExamYear, 8),
    byPath: top(byPath, 6)
  };
}

function fetchJson(targetUrl, timeoutMs) {
  return new Promise(function (resolve, reject) {
    if (!targetUrl) return reject(new Error('no source'));
    var lib = targetUrl.indexOf('https://') === 0 ? https : http;
    var req = lib.get(targetUrl, function (resp) {
      if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
        return fetchJson(resp.headers.location, timeoutMs).then(resolve, reject);
      }
      if (resp.statusCode !== 200) { req.abort(); return reject(new Error('HTTP ' + resp.statusCode)); }
      var data = '';
      resp.setEncoding('utf8');
      resp.on('data', function (c) { data += c; });
      resp.on('end', function () {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('JSON parse error')); }
      });
    });
    req.on('error', function (e) { reject(e); });
    req.setTimeout(timeoutMs || 8000, function () { req.abort(); reject(new Error('timeout')); });
  });
}

function refreshExternal() {
  var now = new Date().toISOString();
  var result = { exams: false, jobs: false, note: '' };
  var tasks = [];
  if (EXAMS_SOURCE) {
    tasks.push(fetchJson(EXAMS_SOURCE).then(function (arr) {
      if (!Array.isArray(arr) || !arr.length) return;
      var ex = readExams();
      var ids = {};
      ex.items.forEach(function (it) { ids[it.id] = true; });
      arr.forEach(function (it) {
        if (it && it.id && !ids[it.id]) {
          it.addedAt = now;
          it.pulledAt = now;
          it.sourceUrl = it.sourceUrl || it.url || EXAMS_SOURCE;
          ex.items.unshift(it);
          ids[it.id] = true;
        }
      });
      ex.lastUpdated = now;
      writeExams(ex);
      result.exams = true;
    }).catch(function (e) { result.examsErr = String(e.message || e); }));
  } else if (DEMO_SYNC) {
    var ex2 = readExams();
    ex2.items.unshift({
      id: 'ex-live-' + Date.now(),
      subject: '408', year: new Date().getFullYear(),
      title: '【联网刷新】最新真题样例 · ' + now.slice(0, 10),
      content: '由管理端「联网刷新」演示写入，未配置 EXAMS_SOURCE 时仅作示意。',
      source: '联网刷新演示', sourceUrl: '', officialCheckUrl: OFFICIAL_PORTAL,
      addedAt: now, pulledAt: now
    });
    ex2.lastUpdated = now;
    writeExams(ex2);
    result.exams = true;
    result.note = '演示同步（未配置外部真题源）';
  }
  if (JOBS_SOURCE) {
    tasks.push(fetchJson(JOBS_SOURCE).then(function (arr) {
      if (!Array.isArray(arr) || !arr.length) return;
      var jb = readJobs();
      var ids = {};
      jb.items.forEach(function (it) { ids[it.id] = true; });
      arr.forEach(function (it) {
        if (it && it.id && !ids[it.id]) {
          it.addedAt = now;
          it.pulledAt = now;
          it.sourceUrl = it.sourceUrl || it.url || JOBS_SOURCE;
          jb.items.unshift(it);
          ids[it.id] = true;
        }
      });
      jb.lastUpdated = now;
      writeJobs(jb);
      result.jobs = true;
    }).catch(function (e) { result.jobsErr = String(e.message || e); }));
  } else if (DEMO_SYNC) {
    var jb2 = readJobs();
    jb2.items.unshift({
      id: 'job-live-' + Date.now(),
      company: '实时同步演示',
      role: '【最新岗位】' + now.slice(0, 10) + ' 发布',
      city: '多地面向校招', major: '计算机/相关', degree: '本科及以上',
      url: '', deadline: '', tag: '实时',
      sourceUrl: '', officialCheckUrl: 'https://www.nowcoder.com/job/',
      addedAt: now, pulledAt: now
    });
    jb2.lastUpdated = now;
    writeJobs(jb2);
    result.jobs = true;
  }
  return Promise.all(tasks).then(function () { return result; });
}

function handleApi(req, res, parsed) {
  var method = req.method;
  if (method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  Object.keys(CORS).forEach(function (k) { res.setHeader(k, CORS[k]); });

  var pathname = parsed.pathname;

  if (pathname === '/api/register' && method === 'POST') {
    parseBody(req).then(function (body) {
      var email = (body.email || '').trim().toLowerCase();
      var password = body.password || '';
      if (!email || !password) return json(res, 400, { error: '邮箱和密码不能为空' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: '邮箱格式不正确' });
      if (password.length < 6) return json(res, 400, { error: '密码至少6位' });
      var store = readUsers();
      if (store.users[email]) return json(res, 409, { error: '该邮箱已注册' });
      var ph = hashPassword(password);
      var token = generateToken(email);
      store.users[email] = {
        email: email, passwordHash: ph.hash, passwordSalt: ph.salt,
        token: token,
        isAdmin: email === ADMIN_EMAIL,
        createdAt: new Date().toISOString(), data: null
      };
      writeUsers(store);
      json(res, 200, { ok: true, token: token, email: email, isAdmin: email === ADMIN_EMAIL });
    });
    return;
  }

  if (pathname === '/api/login' && method === 'POST') {
    parseBody(req).then(function (body) {
      var email = (body.email || '').trim().toLowerCase();
      var password = body.password || '';
      var store = readUsers();
      var user = store.users[email];
      if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
        return json(res, 401, { error: '邮箱或密码错误' });
      }
      var token = generateToken(email);
      user.token = token;
      writeUsers(store);
      json(res, 200, { ok: true, token: token, email: email, isAdmin: !!user.isAdmin, data: user.data || null });
    });
    return;
  }

  if (pathname === '/api/data' && method === 'GET') {
    var token = parsed.query.token;
    var store = readUsers();
    var found = null;
    Object.keys(store.users).forEach(function (email) {
      if (store.users[email].token === token) found = store.users[email];
    });
    if (!found) return json(res, 401, { error: '未登录或登录已过期' });
    return json(res, 200, { ok: true, data: found.data || null, isAdmin: !!found.isAdmin });
  }

  if (pathname === '/api/data' && method === 'POST') {
    parseBody(req).then(function (body) {
      var token = body.token;
      var store = readUsers();
      var found = null;
      Object.keys(store.users).forEach(function (email) {
        if (store.users[email].token === token) found = store.users[email];
      });
      if (!found) return json(res, 401, { error: '未登录或登录已过期' });
      found.data = body.data;
      found.updatedAt = new Date().toISOString();
      writeUsers(store);
      json(res, 200, { ok: true });
    });
    return;
  }

  if (pathname === '/api/anon' && method === 'POST') {
    parseBody(req).then(function (body) {
      var d = body.data || {};
      var anon = readAnon();
      anon.reports.push({
        data: {
          uid: body.uid || '',
          school: d.school || '',
          targetSchool: d.targetSchool || '',
          targetMajor: d.targetMajor || '',
          majorCode: d.majorCode || '',
          examYear: d.examYear || '',
          major: d.major || '',
          paths: Array.isArray(d.paths) ? d.paths : []
        },
        time: new Date().toISOString()
      });
      if (anon.reports.length > 20000) anon.reports = anon.reports.slice(-20000);
      writeAnon(anon);
      json(res, 200, { ok: true });
    });
    return;
  }

  if (pathname === '/api/public/exams' && method === 'GET') {
    var ex = readExams();
    return json(res, 200, { ok: true, lastUpdated: ex.lastUpdated, items: ex.items });
  }

  if (pathname === '/api/public/jobs' && method === 'GET') {
    var jb = readJobs();
    return json(res, 200, { ok: true, lastUpdated: jb.lastUpdated, items: jb.items });
  }

  if (pathname === '/api/public/stats' && method === 'GET') {
    return json(res, 200, { ok: true, stats: computeStats() });
  }

  if (pathname === '/api/public/admission' && method === 'GET') {
    var adm = readAdmission();
    var age = admissionAge(adm);
    var stale = !(adm.items && Object.keys(adm.items).length) || age > ADMISSION_TTL;
    if (stale && ADMISSION_SOURCE) {
      pullAdmissionFromSource().then(function (fresh) {
        json(res, 200, { ok: true, data: fresh, stale: false, age: 0, configured: true });
      }).catch(function () {
        json(res, 200, { ok: true, data: adm, stale: true, age: age, configured: true });
      });
      return;
    }
    return json(res, 200, {
      ok: true, data: adm, stale: stale,
      age: (age === Infinity ? null : age),
      configured: !!ADMISSION_SOURCE
    });
  }

  if (pathname === '/api/admin/admission' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      var adm2 = readAdmission();
      adm2.updatedAt = new Date().toISOString();
      if (body.source) adm2.source = body.source;
      if (body.sourceUrl) adm2.sourceUrl = body.sourceUrl;
      if (body.items && typeof body.items === 'object') adm2.items = body.items;
      if (body.school && body.data) adm2.items[body.school] = body.data;
      writeAdmission(adm2);
      json(res, 200, { ok: true, updatedAt: adm2.updatedAt, count: Object.keys(adm2.items).length });
    });
    return;
  }

  if (pathname === '/api/admin/admission/refresh' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      pullAdmissionFromSource().then(function (fresh) {
        json(res, 200, { ok: true, result: { updatedAt: fresh.updatedAt, count: Object.keys(fresh.items || {}).length } });
      }).catch(function (e) {
        json(res, 200, { ok: false, error: String((e && e.message) || e) });
      });
    });
    return;
  }

  if (pathname === '/api/report' && method === 'POST') {
    parseBody(req).then(function (body) {
      var rep = readReports();
      rep.items.unshift({
        id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        type: body.type || 'exam',
        targetId: body.targetId || '',
        reason: body.reason || '',
        detail: body.detail || '',
        reporterEmail: body.reporterEmail || '',
        time: new Date().toISOString()
      });
      if (rep.items.length > 5000) rep.items = rep.items.slice(0, 5000);
      writeReports(rep);
      json(res, 200, { ok: true, id: rep.items[0].id });
    });
    return;
  }

  if (pathname === '/api/admin' && method === 'GET') {
    var admin = adminAuth(parsed, null);
    if (!admin) return json(res, 403, { error: '管理员密码错误或权限不足' });
    var st = readUsers();
    var anon = readAnon();
    var userList = Object.keys(st.users).map(function (email) {
      var u = st.users[email];
      var p = (u.data && u.data.userProfile) || {};
      return {
        email: email, isAdmin: !!u.isAdmin,
        createdAt: u.createdAt, updatedAt: u.updatedAt || null,
        profile: {
          school: p.school || '', major: p.major || '',
          targetSchool: p.targetSchool || '', targetMajor: p.targetMajor || '',
          examYear: p.examYear || '', majorCode: p.majorCode || '',
          mathCode: p.mathCode || '', paths: p.paths || []
        }
      };
    });
    return json(res, 200, {
      ok: true,
      totalUsers: userList.length,
      users: userList,
      anonReports: anon.reports.length,
      stats: computeStats(),
      exams: readExams(),
      jobs: readJobs(),
      reports: readReports()
    });
  }

  if (pathname === '/api/admin/exams' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      var item = body.item || {};
      if (!item.title) return json(res, 400, { error: '真题标题不能为空' });
      item.id = 'ex-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      item.addedAt = new Date().toISOString();
      item.sourceUrl = item.sourceUrl || OFFICIAL_PORTAL;
      item.officialCheckUrl = item.officialCheckUrl || OFFICIAL_PORTAL;
      var exi = readExams();
      exi.items.unshift(item);
      exi.lastUpdated = item.addedAt;
      writeExams(exi);
      json(res, 200, { ok: true });
    });
    return;
  }

  if (pathname === '/api/admin/exams/update' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      var exi = readExams();
      var idx = -1;
      for (var i = 0; i < exi.items.length; i++) if (exi.items[i].id === body.id) { idx = i; break; }
      if (idx < 0) return json(res, 404, { error: '真题不存在' });
      exi.items[idx] = Object.assign({}, exi.items[idx], body.item || {});
      exi.lastUpdated = new Date().toISOString();
      writeExams(exi);
      json(res, 200, { ok: true });
    });
    return;
  }

  if (pathname === '/api/admin/exams/delete' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      var exi = readExams();
      exi.items = exi.items.filter(function (it) { return it.id !== body.id; });
      exi.lastUpdated = new Date().toISOString();
      writeExams(exi);
      json(res, 200, { ok: true });
    });
    return;
  }

  if (pathname === '/api/admin/jobs' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      var item = body.item || {};
      if (!item.company || !item.role) return json(res, 400, { error: '公司/岗位不能为空' });
      item.id = 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      item.addedAt = new Date().toISOString();
      item.sourceUrl = item.sourceUrl || '';
      item.officialCheckUrl = item.officialCheckUrl || 'https://www.nowcoder.com/job/';
      var jbi = readJobs();
      jbi.items.unshift(item);
      jbi.lastUpdated = item.addedAt;
      writeJobs(jbi);
      json(res, 200, { ok: true });
    });
    return;
  }

  if (pathname === '/api/admin/jobs/update' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      var jbi = readJobs();
      var idx = -1;
      for (var i = 0; i < jbi.items.length; i++) if (jbi.items[i].id === body.id) { idx = i; break; }
      if (idx < 0) return json(res, 404, { error: '岗位不存在' });
      jbi.items[idx] = Object.assign({}, jbi.items[idx], body.item || {});
      jbi.lastUpdated = new Date().toISOString();
      writeJobs(jbi);
      json(res, 200, { ok: true });
    });
    return;
  }

  if (pathname === '/api/admin/jobs/delete' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      var jbi = readJobs();
      jbi.items = jbi.items.filter(function (it) { return it.id !== body.id; });
      jbi.lastUpdated = new Date().toISOString();
      writeJobs(jbi);
      json(res, 200, { ok: true });
    });
    return;
  }

  if (pathname === '/api/admin/refresh' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      refreshExternal().then(function (r) { json(res, 200, { ok: true, result: r }); })
        .catch(function (e) { json(res, 500, { ok: false, error: String(e.message || e) }); });
    });
    return;
  }

  if (pathname === '/api/admin/purge-anon' && method === 'POST') {
    parseBody(req).then(function (body) {
      if (!adminAuth(parsed, body)) return json(res, 403, { error: '权限不足' });
      writeAnon({ reports: [] });
      json(res, 200, { ok: true });
    });
    return;
  }

  if (pathname === '/api/health') return json(res, 200, { ok: true, time: new Date().toISOString() });

  return json(res, 404, { error: 'Not found' });
}

function serveStatic(filePath, res) {
  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found: ' + filePath);
      return;
    }
    var ct = filePath.endsWith('.html') ? 'text/html; charset=utf-8' :
      filePath.endsWith('.js') ? 'application/javascript; charset=utf-8' :
      filePath.endsWith('.css') ? 'text/css; charset=utf-8' :
      filePath.endsWith('.json') ? 'application/json; charset=utf-8' :
      'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': ct,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(data);
  });
}

(function seedAdmin() {
  try {
    var store = readUsers();
    if (!store.users[ADMIN_EMAIL]) {
      var ph = hashPassword(ADMIN_PASSWORD);
      store.users[ADMIN_EMAIL] = {
        email: ADMIN_EMAIL,
        passwordHash: ph.hash, passwordSalt: ph.salt,
        token: generateToken(ADMIN_EMAIL),
        isAdmin: true,
        createdAt: new Date().toISOString(),
        data: null
      };
      writeUsers(store);
      console.log('[帮帮林] 已创建管理员账户: ' + ADMIN_EMAIL);
    } else {
      var u = store.users[ADMIN_EMAIL];
      u.isAdmin = true;
      if (ADMIN_PWD_FROM_ENV && !verifyPassword(ADMIN_PASSWORD, u.passwordHash, u.passwordSalt)) {
        var ph2 = hashPassword(ADMIN_PASSWORD);
        u.passwordHash = ph2.hash;
        u.passwordSalt = ph2.salt;
        u.token = generateToken(ADMIN_EMAIL);
        console.log('[帮帮林] 管理员密码已按 .env 配置更新');
      }
      writeUsers(store);
      console.log('[帮帮林] 管理员账户已就绪: ' + ADMIN_EMAIL);
    }
  } catch (e) { console.error('种子管理员失败:', e); }
})();

function onRequest(req, res) {
  var parsed;
  try { parsed = url.parse(req.url, true); } catch (e) { parsed = { pathname: req.url, query: {} }; }
  var pathname = parsed.pathname || '/';

  if (pathname.indexOf('/api/') === 0) {
    return handleApi(req, res, parsed);
  }
  if (pathname === '/' || pathname === '/index.html') {
    return serveStatic(path.join(__dirname, 'index.html'), res);
  }
  if (pathname === '/admin' || pathname === '/admin.html') {
    return serveStatic(path.join(__dirname, 'admin.html'), res);
  }

  var safe = path.normalize(pathname).replace(/^\\|^\//, '');
  if (safe.indexOf('..') !== -1) {
    res.writeHead(400);
    res.end('Bad path');
    return;
  }
  var filePath = path.join(__dirname, safe);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found. 用户端请访问 / ；管理端请访问 /admin');
    return;
  }
  serveStatic(filePath, res);
}

var serverUser = http.createServer(onRequest);
var serverAdmin = http.createServer(onRequest);

serverUser.listen(PORT_USER, function () {
  console.log('========================================================');
  console.log('  帮帮林 · 考研·就业全周期规划 — 双端口后端');
  console.log('  用户端：http://localhost:' + PORT_USER);
  console.log('  管理端：http://localhost:' + PORT_ADMIN + '/admin');
  console.log('  数据目录：' + DATA_DIR);
  console.log('  管理员账户：' + ADMIN_EMAIL + ' / 密码来源：' + (ADMIN_PWD_FROM_ENV ? '环境变量 .env' : '未配置（占位）'));
  console.log('  联网源：真题=' + (EXAMS_SOURCE || '(未配置,演示同步)') +
    '   岗位=' + (JOBS_SOURCE || '(未配置,演示同步)'));
  console.log('  官方参照：' + OFFICIAL_PORTAL);
  console.log('========================================================');
});
serverAdmin.listen(PORT_ADMIN, function () {});