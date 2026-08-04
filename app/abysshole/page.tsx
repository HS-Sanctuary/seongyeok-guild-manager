'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AbyssHolePage() {
  const [reports, setReports] = useState<any[]>([]);
  const [reporterName, setReporterName] = useState('');
  const [channel, setChannel] = useState('');
  const [holeTime, setHoleTime] = useState('');
  
  // CBT 테스트용 관리자 모드 토글 (나중에는 실제 로그인 계정과 연동)
  const [isAdminMode, setIsAdminMode] = useState(false);

  // 1. 제보 목록 불러오기
  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('abyss_reports')
      .select('*')
      .order('hole_time', { ascending: false });

    if (error) {
      console.error('불러오기 에러:', error);
    } else {
      setReports(data || []);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 2. 새 구멍 제보하기
  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName || !channel || !holeTime) {
      alert('모든 항목을 입력해주세요!');
      return;
    }

    const { error } = await supabase
      .from('abyss_reports')
      .insert([
        { 
          reporter_name: reporterName, 
          channel: channel, 
          hole_time: new Date(holeTime).toISOString(),
          status: 'pending' 
        }
      ]);

    if (error) {
      alert('제보 중 오류가 발생했습니다.');
      console.error(error);
    } else {
      alert('어비스 구멍 제보가 완료되었습니다!');
      setReporterName('');
      setChannel('');
      setHoleTime('');
      fetchReports(); // 목록 새로고침
    }
  };

  // 3. 관리자 승인/반려 처리
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('abyss_reports')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('상태 변경 중 오류가 발생했습니다.');
    } else {
      fetchReports(); // 목록 새로고침
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🕳️ 어비스 구멍 제보소</h1>
        
        {/* CBT용 관리자 스위치 */}
        <label className="flex items-center space-x-2 cursor-pointer bg-gray-800 p-2 rounded-lg">
          <input 
            type="checkbox" 
            checked={isAdminMode} 
            onChange={(e) => setIsAdminMode(e.target.checked)}
            className="w-5 h-5 accent-blue-500"
          />
          <span className="text-sm font-bold text-gray-300">관리자 모드 (CBT 테스트용)</span>
        </label>
      </div>

      {/* 제보 입력 폼 (일반 길드원 뷰) */}
      <form onSubmit={submitReport} className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4">신규 구멍 제보하기</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="제보자 닉네임"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="채널 (예: 1채널)"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <input
            type="datetime-local"
            value={holeTime}
            onChange={(e) => setHoleTime(e.target.value)}
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-white"
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold transition">
          제보하기
        </button>
      </form>

      {/* 제보 목록 현황판 */}
      <h2 className="text-xl font-bold mb-4">실시간 제보 현황</h2>
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border-l-4 border-gray-500">
            <div>
              <p className="text-lg font-bold text-blue-400">{report.channel} <span className="text-gray-300 text-sm ml-2">({new Date(report.hole_time).toLocaleString()})</span></p>
              <p className="text-gray-400 text-sm mt-1">제보자: {report.reporter_name}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 상태 뱃지 */}
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                report.status === 'approved' ? 'bg-green-900 text-green-300' :
                report.status === 'rejected' ? 'bg-red-900 text-red-300' :
                'bg-yellow-900 text-yellow-300'
              }`}>
                {report.status === 'approved' ? '승인됨 (확정)' :
                 report.status === 'rejected' ? '반려됨 (거짓)' : '대기중'}
              </span>

              {/* 관리자 전용 버튼 */}
              {isAdminMode && report.status === 'pending' && (
                <div className="flex space-x-2">
                  <button onClick={() => updateStatus(report.id, 'approved')} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold text-sm">
                    승인
                  </button>
                  <button onClick={() => updateStatus(report.id, 'rejected')} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold text-sm">
                    반려
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-gray-400 text-center py-8">아직 제보된 구멍이 없습니다.</p>}
      </div>
    </div>
  );
}