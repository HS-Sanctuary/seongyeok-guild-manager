namespace IrisDesktop {
 public static class WorkspaceBridgeProbe {
  public static int Calls;
  public static void Bind(DesktopBridge bridge){bridge.BindWorkspace(expanded=>{Calls++;return new {expanded=expanded};});}
 }
}
