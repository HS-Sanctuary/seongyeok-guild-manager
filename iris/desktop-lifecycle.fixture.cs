using System.Threading;
namespace IrisDesktop {
    public static class DesktopLifecycleFixture {
        static DesktopSingleInstance abandoned;
        public static bool RecoverAbandoned(string profile) {
            var thread = new Thread(() => { abandoned = new DesktopSingleInstance("development", profile); });
            thread.Start(); thread.Join();
            using (var recovery = new DesktopSingleInstance("development", profile)) return recovery.IsOwner;
        }
    }
}
