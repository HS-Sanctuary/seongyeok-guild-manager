using System;
using System.IO;
using IrisDesktop;

// Test-only preparer. Uses actual release files, never a user's installed app.
static class LiveUpdateFixture {
 static int Main(string[] args) {
  try {
   if(args.Length!=4)return 2;
   string profile=Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
   string isolated=Environment.GetEnvironmentVariable("WEBVIEW2_USER_DATA_FOLDER");
   bool offline=isolated!=null&&Path.GetFullPath(isolated)==Path.Combine(Path.GetDirectoryName(args[3]),"fresh-webview")&&Directory.Exists(isolated)&&Environment.GetEnvironmentVariable("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS")=="--host-resolver-rules=MAP * ~NOTFOUND --disable-background-networking";
   if(profile.IndexOf("\\Packages\\sandbox.",StringComparison.OrdinalIgnoreCase)<0&&!offline)return 3;
   string tx=DesktopUpdateInstall.Prepare(args[1],File.ReadAllText(args[2]),args[0]);
   File.WriteAllText(args[3],tx);return 0;
  } catch(Exception e) { File.WriteAllText(args[3]+".error",e.ToString());return 1; }
 }
}
