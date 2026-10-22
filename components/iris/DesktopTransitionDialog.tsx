'use client';
import {DesktopFocusDialog} from './DesktopFocusDialog';
export function DesktopTransitionDialog({busy,onRetry,onKeep,onCancel}:{busy:boolean;onRetry():void;onKeep():void;onCancel():void}){
 return <DesktopFocusDialog title="저장 확인 후 전환" onClose={onCancel} dismissDisabled={busy}>
  <p role="status">{busy?'저장 중…':'저장을 확인하지 못했어요. 미저장 변경은 유지돼요.'}</p>
  <p className="iris-caption">이 PC에 보관하면 전환할 수 있지만, 서버 저장 완료는 아니에요. 결과 확인이 필요한 항목은 자동으로 다시 보내지 않아요.</p>
  <div className="iris-save-actions"><button type="button" className="iris-desktop-button" disabled={busy} onClick={onRetry}>재시도</button><button type="button" className="iris-desktop-button" disabled={busy} onClick={onKeep}>이 PC에 보관 후 전환</button><button type="button" className="iris-desktop-button" disabled={busy} onClick={onCancel}>돌아가기</button></div>
 </DesktopFocusDialog>;
}
