using System;
using System.Text;
using System.Threading;
using System.Security.Cryptography;
using System.Security.Principal;
namespace IrisDesktop {
    // One active desktop per Windows user/profile; duplicates signal the existing window only.
    public sealed class DesktopSingleInstance : IDisposable {
        readonly Mutex mutex;
        readonly EventWaitHandle activation;
        public bool IsOwner { get; private set; }
        public DesktopSingleInstance(string environment, string profile) {
            DesktopHostPolicy.ProfilePath(environment);
            if (!System.IO.Path.IsPathRooted(profile)) throw new ArgumentException("Dedicated profile required");
            string key;
            using (var hash = SHA256.Create()) key = BitConverter.ToString(hash.ComputeHash(Encoding.UTF8.GetBytes(
                WindowsIdentity.GetCurrent().User.Value + ":" + environment + ":" + System.IO.Path.GetFullPath(profile).ToUpperInvariant()))).Replace("-", "");
            bool created;
            mutex = new Mutex(false, "Local\\SANCTUM.IRIS.Desktop." + key, out created);
            activation = new EventWaitHandle(false, EventResetMode.AutoReset, "Local\\SANCTUM.IRIS.Activate." + key);
            // WaitOne distinguishes an abandoned mutex from an active owner after a process crash.
            bool abandoned = false;
            try { IsOwner = mutex.WaitOne(0); } catch (AbandonedMutexException) { IsOwner = true; abandoned = true; }
            if (!created && IsOwner && !abandoned) {
                // Same-thread reentrant construction must still be treated as a duplicate.
                mutex.ReleaseMutex(); IsOwner = false;
            }
            if (!IsOwner) activation.Set();
        }
        public bool TakeActivation() { return IsOwner && activation.WaitOne(0); }
        public void Dispose() { activation.Dispose(); if (IsOwner) { mutex.ReleaseMutex(); IsOwner = false; } mutex.Dispose(); }
    }
}
