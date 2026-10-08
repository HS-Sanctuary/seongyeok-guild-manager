using System;
using System.Drawing;

namespace IrisDesktop {
    public sealed class AddonWindowPreferences {
        public string DockSide = "right";
        public bool SameLayer = true;
        public static bool Valid(AddonWindowPreferences value) {
            return value != null && (value.DockSide == "right" || value.DockSide == "left" || value.DockSide == "off");
        }
    }
    public sealed class AddonDockPlacement {
        public Rectangle Bounds;
        public string ActualSide = "off";
        public bool Attached;
    }
    public static class AddonWindowPolicy {
        public static AddonDockPlacement Place(Rectangle game, Rectangle work, Size addon, string side) {
            var result = new AddonDockPlacement();
            if (side == "off" || (side != "right" && side != "left") || work.Width < 320 || work.Height < 120 || game.Width <= 0 || game.Height <= 0) return result;
            int width = Math.Max(320, Math.Min(480, addon.Width));
            int height = Math.Min(work.Height, Math.Max(120, game.Height));
            int top = Math.Max(work.Top, Math.Min(game.Top, work.Bottom - height));
            bool right = game.Right >= work.Left && game.Right + width <= work.Right;
            bool left = game.Left <= work.Right && game.Left - width >= work.Left;
            string actual = side == "right" ? (right ? "right" : left ? "left" : "off") : (left ? "left" : right ? "right" : "off");
            if (actual == "off") return result;
            result.Attached = true; result.ActualSide = actual;
            result.Bounds = new Rectangle(actual == "right" ? game.Right : game.Left - width, top, width, height);
            return result;
        }
    }
    public sealed class GameWindowObservation {
        public int ProcessId;
        public long StartedAtTicks;
        public bool? Alive;
        public IntPtr Handle;
        public Rectangle? Frame;
        public bool Minimized;
    }
    public sealed class AddonWindowDecision {
        public bool Minimize, Restore, RequestClose;
    }
    // Window replacement and inaccessible processes are deliberately not an exit signal.
    public sealed class GameWindowSession {
        int pid; long started; bool minimized, hiddenByGame, askedExit;
        public void ManualVisibility() { hiddenByGame = false; }
        public AddonWindowDecision Observe(GameWindowObservation observation, bool manuallyHidden, bool decisionOpen) {
            var result = new AddonWindowDecision();
            if (observation == null || observation.ProcessId <= 0 || observation.StartedAtTicks <= 0) return result;
            if (observation.ProcessId != pid || observation.StartedAtTicks != started) {
                pid = observation.ProcessId; started = observation.StartedAtTicks;
                minimized = false; hiddenByGame = false; askedExit = false;
            }
            if (observation.Alive == false) {
                if (!askedExit) { askedExit = true; result.RequestClose = true; }
                return result;
            }
            if (observation.Alive != true || observation.Handle == IntPtr.Zero || !observation.Frame.HasValue) return result;
            if (decisionOpen) { minimized = observation.Minimized; return result; }
            if (observation.Minimized && !minimized && !manuallyHidden) {
                hiddenByGame = true; result.Minimize = true;
            } else if (!observation.Minimized && hiddenByGame) {
                hiddenByGame = false; result.Restore = !manuallyHidden;
            }
            minimized = observation.Minimized;
            return result;
        }
    }
}
