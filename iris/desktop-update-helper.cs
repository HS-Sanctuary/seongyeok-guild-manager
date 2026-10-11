using System;
using System.Windows.Forms;
namespace IrisDesktop {
 internal static class UpdateHelperProgram {
  [STAThread] static void Main(string[] args){
   try {if(args.Length!=2||(args[0]!="--apply"&&args[0]!="--recover"))throw new ArgumentException();DesktopUpdateInstall.Apply(DesktopUpdateInstall.Transaction(args[1]),args[0]=="--recover");}
   catch {MessageBox.Show("IRIS 업데이트를 완료하지 못했어요. 기존 파일과 보호 대기함은 지우지 않아요. IRIS를 다시 실행해 확인해 주세요. 계속 실패하면 다운로드 안내에서 새 ZIP을 별도 폴더에 풀어 실행하고 한설에게 알려주세요.","IRIS 업데이트",MessageBoxButtons.OK,MessageBoxIcon.Warning);}
  }
 }
}
