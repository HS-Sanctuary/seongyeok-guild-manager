using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace Iris
{
    public interface IShortcutRegistry
    {
        bool Register(int id, uint modifiers, uint key);
        void Unregister(int id);
    }

    public sealed class HotkeyRecovery : IDisposable
    {
        public const int VisibilityId = 0x4952;
        public const int InputId = 0x4953;
        private readonly IShortcutRegistry registry;
        private bool visibilityRegistered, inputRegistered;
        public bool Available { get { return visibilityRegistered && inputRegistered; } }
        public HotkeyRecovery(IShortcutRegistry registry)
        {
            this.registry = registry;
            // CTRL + ALT + NOREPEAT. Both must be available before enabling click-through.
            visibilityRegistered = registry.Register(VisibilityId, 0x4003, 0x49);
            if (visibilityRegistered) inputRegistered = registry.Register(InputId, 0x4003, 0x4f);
            if (!Available) Dispose();
        }
        public void Dispose()
        {
            if (visibilityRegistered) registry.Unregister(VisibilityId);
            if (inputRegistered) registry.Unregister(InputId);
            visibilityRegistered = inputRegistered = false;
        }
    }

    internal sealed class WindowShortcuts : IShortcutRegistry
    {
        private readonly IntPtr window;
        public WindowShortcuts(IntPtr window) { this.window = window; }
        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool RegisterHotKey(IntPtr window, int id, uint modifiers, uint key);
        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool UnregisterHotKey(IntPtr window, int id);
        public bool Register(int id, uint modifiers, uint key) { return RegisterHotKey(window, id, modifiers, key); }
        public void Unregister(int id) { UnregisterHotKey(window, id); }
    }

    public class OverlayWindow : Form
    {
        private HotkeyRecovery recovery;
        private bool clickThrough;
        public bool OwnsShortcuts { get; private set; }
        public OverlayWindow ShortcutOwner { get; set; }
        public OverlayWindow() : this(true) { }
        public OverlayWindow(bool ownsShortcuts) { OwnsShortcuts = ownsShortcuts; }
        public bool ShortcutsAvailable { get { return OwnsShortcuts ? recovery != null && recovery.Available : ShortcutOwner != null && ShortcutOwner.OwnsShortcuts && ShortcutOwner.ShortcutsAvailable; } }
        public event EventHandler VisibilityShortcut;
        public event EventHandler InputShortcut;
        public event EventHandler ShortcutsChanged;
        protected override bool ShowWithoutActivation { get { return true; } }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            if (OwnsShortcuts) recovery = new HotkeyRecovery(new WindowShortcuts(Handle));
            clickThrough = false;
            if (ShortcutsChanged != null) ShortcutsChanged(this, EventArgs.Empty);
        }
        protected override void OnHandleDestroyed(EventArgs e)
        {
            if (recovery != null) recovery.Dispose();
            recovery = null;
            clickThrough = false;
            base.OnHandleDestroyed(e);
        }
        protected override void WndProc(ref Message message)
        {
            if (message.Msg == 0x0312 && OwnsShortcuts && ShortcutsAvailable)
            {
                if (message.WParam.ToInt32() == HotkeyRecovery.VisibilityId && VisibilityShortcut != null)
                    VisibilityShortcut(this, EventArgs.Empty);
                else if (message.WParam.ToInt32() == HotkeyRecovery.InputId && InputShortcut != null)
                    InputShortcut(this, EventArgs.Empty);
            }
            base.WndProc(ref message);
        }
        protected override CreateParams CreateParams
        {
            get
            {
                var parameters = base.CreateParams;
                parameters.ExStyle = (int)StyleFor(parameters.ExStyle, clickThrough);
                return parameters;
            }
        }
        public static long StyleFor(long current, bool enabled)
        {
            return enabled ? current | 0x20L : current & ~0x20L;
        }
        [DllImport("user32.dll", EntryPoint = "GetWindowLongW", SetLastError = true)]
        private static extern int GetWindowLong32(IntPtr window, int index);
        [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW", SetLastError = true)]
        private static extern IntPtr GetWindowLong64(IntPtr window, int index);
        [DllImport("user32.dll", EntryPoint = "SetWindowLongW", SetLastError = true)]
        private static extern int SetWindowLong32(IntPtr window, int index, int value);
        [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW", SetLastError = true)]
        private static extern IntPtr SetWindowLong64(IntPtr window, int index, IntPtr value);
        [DllImport("kernel32.dll")]
        private static extern void SetLastError(uint error);

        public bool ApplyClickThrough(bool enabled)
        {
            if (!IsHandleCreated || (enabled && !ShortcutsAvailable)) return false;
            SetLastError(0);
            long style = IntPtr.Size == 8 ? GetWindowLong64(Handle, -20).ToInt64() : GetWindowLong32(Handle, -20);
            if (style == 0 && Marshal.GetLastWin32Error() != 0) return false;
            long updated = StyleFor(style, enabled);
            SetLastError(0);
            long previous = IntPtr.Size == 8 ? SetWindowLong64(Handle, -20, new IntPtr(updated)).ToInt64() : SetWindowLong32(Handle, -20, (int)updated);
            if (previous == 0 && Marshal.GetLastWin32Error() != 0) return false;
            clickThrough = enabled;
            return true;
        }
    }
}
