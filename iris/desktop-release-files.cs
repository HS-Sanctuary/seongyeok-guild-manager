using System;
using System.IO;
using System.Security.Cryptography;

namespace IrisDesktop {
 // Keep the original updater's allowlisted payload intact. The friendly copy
 // is generated locally after launch, never added to the signed-by-hash ZIP.
 public static class DesktopReleaseFiles {
  static void PlainPath(string path) {
   for(string item=path;!String.IsNullOrEmpty(item);item=Path.GetDirectoryName(item))
    if((File.Exists(item)||Directory.Exists(item))&&(File.GetAttributes(item)&FileAttributes.ReparsePoint)!=0)throw new IOException("Linked icon path");
  }
  static string Digest(string path) {using(var stream=File.OpenRead(path))using(var hash=SHA256.Create())return Convert.ToBase64String(hash.ComputeHash(stream));}
  public static bool EnsureIconName(string directory) {
   try {
    directory=Path.GetFullPath(directory);PlainPath(directory);
    string original=Path.Combine(directory,"IRIS.ico"),visible=Path.Combine(directory,"\uC544\uC774\uB9AC\uC2A4 \uB85C\uACE0.ico");
    PlainPath(original);PlainPath(visible);
    if(!File.Exists(original))return false;
    if(!File.Exists(visible))File.Copy(original,visible,false);
    // Never overwrite a pre-existing personal file, or hide the only icon.
    if(Digest(original)!=Digest(visible))return false;
    File.SetAttributes(visible,File.GetAttributes(visible)&~FileAttributes.Hidden);
    File.SetAttributes(original,File.GetAttributes(original)|FileAttributes.Hidden);
    return true;
   }catch {return false;} // Read-only installations must still start normally.
  }
 }
}
