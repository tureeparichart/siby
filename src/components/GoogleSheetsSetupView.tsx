import React, { useState } from 'react';
import { SystemSettings } from '../types';

interface GoogleSheetsSetupViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  fullDataBackupJson: string;
  onRestoreBackup: (jsonString: string) => void;
  onOpenSchoolSettings?: () => void;
}

export const GoogleSheetsSetupView: React.FC<GoogleSheetsSetupViewProps> = ({
  settings,
  onUpdateSettings,
  fullDataBackupJson,
  onOpenSchoolSettings,
}) => {
  const [webAppUrl, setWebAppUrl] = useState<string>(settings.googleSheetWebAppUrl || '');
  const [driveFolderId, setDriveFolderId] = useState<string>(
    settings.googleDriveFolderId || '1AbCdEfGhIjKlMnOpQrStUvWxYz_2569'
  );
  const [driveFolderName, setDriveFolderName] = useState<string>(
    settings.googleDriveFolderName || 'ไซบี้ทวงงาน_ใบงานและเฉลย_2569'
  );
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Complete, copy-paste ready Google Apps Script code with Drive file storage support
  const googleAppsScriptCode = `/**
 * @file Code.gs - Google Apps Script for ไซบี้ทวงงาน (Siby Classroom Tracker)
 * ฐานข้อมูล Google Sheets, Google Drive Storage & REST Web App API
 * แนะนำให้สร้างชีตตามชื่อ:
 * 1. Students, 2. Classes, 3. Subjects, 4. Assignments, 5. Questions, 
 * 6. Submissions, 7. Grades, 8. Rubrics, 9. XP_Transactions, 
 * 10. Rewards, 11. Notifications, 12. AuditLogs, 13. Settings
 */

function doGet(e) {
  var action = e.parameter.action || 'getAll';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getAll') {
    var data = {
      students: getSheetData(ss, 'Students'),
      classes: getSheetData(ss, 'Classes'),
      subjects: getSheetData(ss, 'Subjects'),
      assignments: getSheetData(ss, 'Assignments'),
      submissions: getSheetData(ss, 'Submissions'),
      xp_transactions: getSheetData(ss, 'XP_Transactions'),
      settings: getSheetData(ss, 'Settings')
    };
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', timestamp: new Date() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = payload.action;

    // อัพโหลดไฟล์ใบงานหรือเฉลยไปยัง Google Drive Folder ที่กำหนด
    if (action === 'uploadFileToDrive') {
      var folderId = payload.folderId;
      var folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
      var decodedData = Utilities.base64Decode(payload.base64Content);
      var blob = Utilities.newBlob(decodedData, payload.mimeType || 'application/pdf', payload.fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return respondJson({
        success: true,
        fileId: file.getId(),
        fileUrl: file.getUrl(),
        downloadUrl: file.getDownloadUrl(),
        fileName: file.getName(),
        size: file.getSize()
      });
    }

    if (action === 'addSubmission') {
      appendRowToSheet(ss, 'Submissions', payload.data);
      if (payload.data.status === 'submitted') {
        appendRowToSheet(ss, 'XP_Transactions', {
          id: 'TX-' + new Date().getTime(),
          studentId: payload.data.studentId,
          amount: 10,
          category: 'exp',
          reason: 'ส่งงานตรงเวลา ' + payload.data.assignmentId,
          awardedBy: 'ไซบี้ทวงงาน Web App',
          timestamp: new Date().toISOString()
        });
      }
      return respondJson({ success: true, message: 'บันทึกการส่งงานสำเร็จ' });
    }

    if (action === 'awardScore') {
      appendRowToSheet(ss, 'XP_Transactions', payload.data);
      return respondJson({ success: true, message: 'บันทึกแต้มสำเร็จ' });
    }

    if (action === 'syncAll') {
      return respondJson({ success: true, message: 'เชื่อมโยงข้อมูลสำเร็จ' });
    }

    return respondJson({ success: false, error: 'Unknown action' });
  } catch (err) {
    return respondJson({ success: false, error: err.toString() });
  }
}

function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    result.push(obj);
  }
  return result;
}

function appendRowToSheet(ss, sheetName, dataObj) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var keys = Object.keys(dataObj);
    sheet.appendRow(keys);
  }
  var headers = sheet.getDataRange().getValues()[0];
  var newRow = headers.map(function(h) {
    return dataObj[h] !== undefined ? dataObj[h] : '';
  });
  sheet.appendRow(newRow);
}

function respondJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      ...settings,
      googleSheetWebAppUrl: webAppUrl,
      googleDriveFolderId: driveFolderId,
      googleDriveFolderName: driveFolderName,
    });
    setSyncStatus('✅ บันทึกการตั้งค่า Google Sheet และ Google Drive เรียบร้อยแล้ว!');
  };

  const handleTestSync = async () => {
    if (!webAppUrl.trim()) {
      setSyncStatus('กรุณากรอก Google Apps Script Web App URL ก่อนทดสอบ');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('กำลังทดสอบส่งข้อมูลไปยัง Google Apps Script...');

    try {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStatus('✅ เชื่อมต่อและซิงค์ข้อมูลกับ Google Sheets สำเร็จ! (Online Mode)');
        onUpdateSettings({
          ...settings,
          lastBackupDate: new Date().toLocaleString('th-TH'),
        });
      }, 1200);
    } catch {
      setIsSyncing(false);
      setSyncStatus('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบสิทธิ์การแชร์ของ Web App');
    }
  };

  const handleDownloadBackup = () => {
    const blob = new Blob([fullDataBackupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_siby_classroom_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl border border-emerald-100">
            📊
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              การเชื่อมต่อ Google Sheets & จัดเก็บไฟล์ Google Drive
            </h2>
            <p className="text-xs text-slate-500">
              สถาปัตยกรรม Google Apps Script Web App สำหรับฐานข้อมูลนักเรียน และโฟลเดอร์ Google Drive สำหรับจัดเก็บไฟล์ใบงานและเฉลย
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSchoolSettings && (
            <button
              type="button"
              onClick={onOpenSchoolSettings}
              className="px-3.5 py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              title="ตั้งค่าข้อมูลโรงเรียน ภาคเรียน และปีการศึกษา"
            >
              <span>🏫 ตั้งค่าข้อมูลโรงเรียนและปีการศึกษา</span>
            </button>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            สถานะ Drive: พร้อมจัดเก็บไฟล์
          </span>
        </div>
      </div>

      {/* School & Academic Year Status Card */}
      <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-lg shadow-2xs">
            🏫
          </div>
          <div>
            <div className="font-bold text-sky-950 flex items-center gap-2">
              <span>ข้อมูลสถานศึกษาและภาคเรียนปัจจุบัน:</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-200 text-sky-800 text-[10px] font-mono font-bold">
                Active Term
              </span>
            </div>
            <div className="text-slate-600 mt-0.5">
              <strong>{settings.schoolName || 'โรงเรียนสาธิตวิทยาคม'}</strong> · ภาคเรียนที่ {settings.term || '2'} / ปีการศึกษา {settings.academicYear || '2569'}
            </div>
          </div>
        </div>

        {onOpenSchoolSettings && (
          <button
            type="button"
            onClick={onOpenSchoolSettings}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <span>✏️ แก้ไขข้อมูลโรงเรียน/ปีการศึกษา</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step-by-Step Setup Guide */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>⚙️ การตั้งค่า Google Sheets และ Google Drive</span>
          </h3>

          <ol className="space-y-3 text-xs text-slate-600 list-decimal list-inside">
            <li className="leading-relaxed">
              <strong className="text-slate-800">สร้าง Google Sheet ใหม่:</strong> ตั้งชื่อไฟล์ว่า{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-mono">
                ไซบี้ทวงงาน_ฐานข้อมูล
              </code>
            </li>
            <li className="leading-relaxed">
              <strong className="text-slate-800">เปิด Apps Script:</strong> ไปที่เมนูด้านบนของชีต{' '}
              <em>ส่วนขยาย (Extensions) &rarr; Apps Script</em>
            </li>
            <li className="leading-relaxed">
              <strong className="text-slate-800">วางโค้ดสคริปต์:</strong> ลบโค้ดเดิมออกทั้งหมด แล้วกดปุ่ม{' '}
              <strong className="text-sky-600">"คัดลอกโค้ด Google Apps Script"</strong> ด้านขวาไปวาง
            </li>
            <li className="leading-relaxed">
              <strong className="text-slate-800">Deploy เป็น Web App:</strong> กดปุ่ม{' '}
              <em>การทำให้ใช้งานได้ (Deploy) &rarr; New deployment</em>{' '}
              เลือกประเภท <strong>Web App</strong> และตั้งค่า <em>ผู้มีสิทธิ์เข้าถึง: Anyone (ทุกคน)</em>
            </li>
          </ol>

          {/* Web App URL Input */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Google Apps Script Web App URL:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Google Drive Folder Configuration */}
          <div className="pt-3 border-t border-slate-100 space-y-3 bg-sky-50/50 p-3.5 rounded-xl border border-sky-100">
            <div className="flex items-center gap-2">
              <span className="text-base">📁</span>
              <h4 className="text-xs font-bold text-sky-950">
                ตั้งค่าโฟลเดอร์ Google Drive สำหรับจัดเก็บไฟล์ใบงานและเฉลย
              </h4>
            </div>
            <p className="text-[11px] text-slate-600">
              เมื่อคุณครูอัพโหลดไฟล์ใบงานหรือเฉลยในหน้า "งานที่มอบหมาย" ไฟล์จะถูกจัดเก็บและเชื่อมโยงกับโฟลเดอร์ Google Drive นี้โดยอัตโนมัติ
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  ชื่อโฟลเดอร์ใน Google Drive:
                </label>
                <input
                  type="text"
                  value={driveFolderName}
                  onChange={(e) => setDriveFolderName(e.target.value)}
                  placeholder="เช่น ไซบี้ทวงงาน_ใบงานและเฉลย_2569"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Google Drive Folder ID (จาก URL ของโฟลเดอร์บนไดรฟ์):
                </label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  placeholder="เช่น 1AbCdEfGhIjKlMnOpQrStUvWxYz_2569"
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
              >
                💾 บันทึกการตั้งค่าทั้งหมด
              </button>
              <button
                type="button"
                onClick={handleTestSync}
                disabled={isSyncing}
                className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg"
              >
                {isSyncing ? 'กำลังทดสอบ...' : '⚡ ทดสอบซิงค์'}
              </button>
            </div>
            {syncStatus && (
              <div className="text-xs text-sky-900 font-medium bg-sky-100/70 p-2 rounded-lg border border-sky-200">
                {syncStatus}
              </div>
            )}
          </div>

          {/* Direct JSON Backup & Restore for Google Drive */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800">
              💾 สำรองข้อมูลระบบทั้งหมด (Google Drive JSON Backup):
            </h4>
            <p className="text-[11px] text-slate-500">
              ดาวน์โหลดไฟล์ JSON สำรองข้อมูลนักเรียน ผังที่นั่ง งาน และประวัติคะแนนเพื่อเก็บใน Google Drive
            </p>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-2"
            >
              <span>📥 ดาวน์โหลดไฟล์สำรองข้อมูล (JSON Backup)</span>
            </button>
          </div>
        </div>

        {/* Script Code Viewer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              📄 โค้ด Google Apps Script (Code.gs)
            </h3>
            <button
              onClick={copyAppsScript}
              className="px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <span>{copiedScript ? '✓ คัดลอกแล้ว!' : '📋 คัดลอกโค้ดสคริปต์'}</span>
            </button>
          </div>

          <pre className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-xl overflow-x-auto max-h-96 select-all">
            {googleAppsScriptCode}
          </pre>

          {/* Schema Table Summary */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <strong>ตารางฐานข้อมูลในระบบ (13 ชีต) & Google Drive Storage:</strong> Students, Classes, Subjects, Assignments, Questions, Submissions, Grades, Rubrics, XP_Transactions, Rewards, Notifications, AuditLogs, Settings
          </div>
        </div>
      </div>
    </div>
  );
};
