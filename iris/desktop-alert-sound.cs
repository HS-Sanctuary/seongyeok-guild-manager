using System;
using System.IO;
using System.Media;
using System.Threading.Tasks;
namespace IrisDesktop {
 public sealed class DesktopAlertSound {
  readonly object gate=new object();readonly Func<DateTime> clock;readonly Action<byte[]> output;DateTime last=DateTime.MinValue;
  public DesktopAlertSound():this(()=>DateTime.UtcNow,PlayWave){}
  public DesktopAlertSound(Func<DateTime> clock,Action<byte[]> output){this.clock=clock;this.output=output;}
  public bool Play(){lock(gate){var now=clock();if(now-last<TimeSpan.FromSeconds(2))return false;last=now;try{output(Bell());return true;}catch{return false;}}}
  static byte[] Bell(){const int rate=22050,count=13230;using(var memory=new MemoryStream()){using(var writer=new BinaryWriter(memory,System.Text.Encoding.ASCII,true)){writer.Write(System.Text.Encoding.ASCII.GetBytes("RIFF"));writer.Write(36+count*2);writer.Write(System.Text.Encoding.ASCII.GetBytes("WAVEfmt "));writer.Write(16);writer.Write((short)1);writer.Write((short)1);writer.Write(rate);writer.Write(rate*2);writer.Write((short)2);writer.Write((short)16);writer.Write(System.Text.Encoding.ASCII.GetBytes("data"));writer.Write(count*2);for(int i=0;i<count;i++){double t=i/(double)rate,ring=Math.Sin(2*Math.PI*1318*t)+.45*Math.Sin(2*Math.PI*1977*t);double echo=t<.22?0:Math.Sin(2*Math.PI*1760*(t-.22))*Math.Exp(-14*(t-.22));double sample=(ring*Math.Exp(-13*t)+.5*echo)*Math.Min(1,t/.004)*Math.Min(1,(.6-t)/.02);writer.Write((short)Math.Max(Int16.MinValue,Math.Min(Int16.MaxValue,sample*4500)));}}return memory.ToArray();}}
  static void PlayWave(byte[] wave){var stream=new MemoryStream(wave);var player=new SoundPlayer(stream);try{player.Load();player.Play();Task.Delay(900).ContinueWith(_=>{player.Dispose();stream.Dispose();});}catch{player.Dispose();stream.Dispose();throw;}}
 }
}
