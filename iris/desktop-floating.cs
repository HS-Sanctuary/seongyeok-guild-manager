using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;

namespace IrisDesktop {
 public sealed class FloatingPreferences {
  public int IconSize=36,Opacity=80;public uint Modifiers=1,Key=0xc0;public bool WindowedFloating;
  public static bool Valid(int size,int opacity,uint modifiers,uint key){
   bool supported=key==0xc0||key>=0x30&&key<=0x39||key>=0x41&&key<=0x5a||key>=0x70&&key<=0x7b;
   return size>=36&&size<=80&&opacity>=35&&opacity<=100&&(modifiers&~7u)==0&&(modifiers&3)!=0&&supported&&!(modifiers==3&&(key==0x49||key==0x4f));
  }
  public string Label {get {var parts=new List<string>();if((Modifiers&2)!=0)parts.Add("Ctrl");if((Modifiers&1)!=0)parts.Add("Alt");if((Modifiers&4)!=0)parts.Add("Shift");parts.Add(Key==0xc0?"~":Key>=0x70?"F"+(Key-0x6f):((char)Key).ToString());return "("+String.Join(" + ",parts.ToArray())+")";}}
  public object State(){return new{iconSize=IconSize,opacity=Opacity,modifiers=Modifiers,key=Key,windowedFloating=WindowedFloating};}
 }
 public sealed class DesktopFloatingHotkey:IDisposable {
  public const int Id=0x4954;const int ReplacementId=0x4955;readonly Iris.IShortcutRegistry registry;readonly Action toggle;int activeId;uint modifiers=1,key=0xc0;
  public bool Available {get{return activeId!=0;}}
  public DesktopFloatingHotkey(Iris.IShortcutRegistry registry,Action toggle):this(registry,toggle,1,0xc0){}
  public DesktopFloatingHotkey(Iris.IShortcutRegistry registry,Action toggle,uint modifiers,uint key){this.registry=registry;this.toggle=toggle;this.modifiers=modifiers;this.key=key;if(registry.Register(Id,modifiers|0x4000,key))activeId=Id;}
  public bool Change(uint mod,uint next){
   if(!FloatingPreferences.Valid(52,80,mod,next))return false;if(mod==modifiers&&next==key&&Available)return true;
   int id=activeId==Id?ReplacementId:Id;if(!registry.Register(id,mod|0x4000,next))return false;
   if(activeId!=0)registry.Unregister(activeId);activeId=id;modifiers=mod;key=next;return true;
  }
  public void Dispatch(int id){if(activeId!=0&&id==activeId)toggle();}
  public void Dispose(){if(activeId!=0)registry.Unregister(activeId);activeId=0;}
 }
 public sealed class FloatingLayoutResult {
  public Rectangle Bounds,Anchor,Badge;public Rectangle[] Menu;public Rectangle? Bubble,Panel;public bool Left,Up,BadgeVisible=true;public double Scale;
  object Rect(Rectangle r){return new{x=r.X/Scale,y=r.Y/Scale,width=r.Width/Scale,height=r.Height/Scale};}
  public object Geometry(){var menu=new List<object>();foreach(var r in Menu)menu.Add(Rect(r));return new{width=Bounds.Width/Scale,height=Bounds.Height/Scale,anchor=new{x=Anchor.X/Scale,y=Anchor.Y/Scale,size=Anchor.Width/Scale},badge=Rect(Badge),side=Left?"left":"right",vertical=Up?"up":"down",menu=menu.ToArray(),bubble=Bubble.HasValue?Rect(Bubble.Value):null,panel=Panel.HasValue?Rect(Panel.Value):null};}
  public Region CreateRegion(){
   var region=new Region();region.MakeEmpty();using(var path=new GraphicsPath()){path.AddEllipse(Anchor);region.Union(path);}
   // Match the CSS keycap's 9-DIP corners in the native window clipping region.
   if(BadgeVisible)using(var path=new GraphicsPath()){float d=(float)Math.Min(18*Scale,Math.Min(Badge.Width,Badge.Height));path.AddArc(Badge.Left,Badge.Top,d,d,180,90);path.AddArc(Badge.Right-d,Badge.Top,d,d,270,90);path.AddArc(Badge.Right-d,Badge.Bottom-d,d,d,0,90);path.AddArc(Badge.Left,Badge.Bottom-d,d,d,90,90);path.CloseFigure();region.Union(path);}
   foreach(var r in Menu)using(var path=new GraphicsPath()){path.AddEllipse(r);region.Union(path);}if(Bubble.HasValue)using(var path=new GraphicsPath()){var b=Bubble.Value;float d=(float)Math.Min(24*Scale,Math.Min(b.Width,b.Height));path.AddArc(b.Left,b.Top,d,d,180,90);path.AddArc(b.Right-d,b.Top,d,d,270,90);path.AddArc(b.Right-d,b.Bottom-d,d,d,0,90);path.AddArc(b.Left,b.Bottom-d,d,d,90,90);path.CloseFigure();region.Union(path);}if(Panel.HasValue)region.Union(Panel.Value);return region;
  }
 }
 public static class FloatingLayout {
  public static bool FitsContainer(Rectangle work,int dpi){return dpi>=48&&dpi<=768&&work.Width>=dpi&&work.Height>=Math.Ceiling(128*dpi/96d);}
  public static FloatingLayoutResult Calculate(Point anchor,Rectangle work,Size panel,bool menu,bool bubble,bool panelOpen,int dpi){return Calculate(anchor,work,panel,menu,bubble,panelOpen,dpi,36);}
  public static FloatingLayoutResult Calculate(Point anchor,Rectangle work,Size panel,bool menu,bool bubble,bool panelOpen,int dpi,int iconSize,int badgeDip=57,int bubbleDip=180){
   if(!FitsContainer(work,dpi)||iconSize<36||iconSize>80)throw new ArgumentException();
   double scale=dpi/96d;Func<int,int> px=v=>(int)Math.Ceiling(v*scale);int margin=Math.Min(px(8),Math.Min(work.Width,work.Height)/8),gap=px(2),size=Math.Min(px(iconSize),Math.Min(work.Width-margin*2,work.Height-margin*2-gap-px(20))),badgeWidth=Math.Min(px(Math.Max(52,Math.Min(320,badgeDip))),work.Width-margin*2),badgeHeight=px(20);
   var inner=new Rectangle(work.Left+margin,work.Top+margin,work.Width-margin*2,work.Height-margin*2);
   int x=Math.Max(inner.Left,Math.Min(anchor.X,inner.Right-size));int y=Math.Max(inner.Top,Math.Min(anchor.Y,inner.Bottom-size-gap-badgeHeight));
   var logo=new Rectangle(x,y,size,size);var badge=new Rectangle(Math.Max(inner.Left,Math.Min(x+(size-badgeWidth)/2,inner.Right-badgeWidth)),y+size+gap,badgeWidth,badgeHeight);
   bool left=x+size/2>work.Left+work.Width/2,up=y+size/2>work.Top+work.Height/2;
   var elements=new List<Rectangle>{logo,badge};var buttons=new List<Rectangle>();
if(menu){int button=Math.Min(px(36),Math.Min(inner.Width/6,inner.Height*4/29)),step=button+Math.Min(px(8),button/4),height=step*5+button,top=Math.Max(inner.Top,Math.Min(y+size/2-height/2,inner.Bottom-height));for(int i=0;i<6;i++){int distance=size/2+px(i==0||i==5?28:i==2||i==3?48:42);int cx=x+size/2+distance*(left?-1:1);var r=Fit(new Rectangle(cx-button/2,top+i*step,button,button),inner);buttons.Add(r);elements.Add(r);}}
   Rectangle? notice=null,surface=null;
   if(bubble&&!menu&&!panelOpen){notice=Place(new Size(px(300),px(Math.Max(80,Math.Min(360,bubbleDip)))),logo,inner,left,up,px(12));elements.Add(notice.Value);}
   if(panelOpen){surface=Place(new Size(px(panel.Width),px(panel.Height)),logo,inner,left,up,px(12));elements.Add(surface.Value);}
   var bounds=elements[0];foreach(var r in elements)bounds=Rectangle.Union(bounds,r);Point shift=new Point(-bounds.Left,-bounds.Top);
   Func<Rectangle,Rectangle> local=r=>{r.Offset(shift);return r;};for(int i=0;i<buttons.Count;i++)buttons[i]=local(buttons[i]);
   return new FloatingLayoutResult{Bounds=bounds,Anchor=local(logo),Badge=local(badge),BadgeVisible=!menu,Menu=buttons.ToArray(),Bubble=notice.HasValue?(Rectangle?)local(notice.Value):null,Panel=surface.HasValue?(Rectangle?)local(surface.Value):null,Scale=scale,Left=left,Up=up};
  }
  static Rectangle Place(Size size,Rectangle logo,Rectangle work,bool left,bool up,int gap){int w=Math.Min(size.Width,work.Width),h=Math.Min(size.Height,work.Height);return Fit(new Rectangle(left?logo.Left-gap-w:logo.Right+gap,up?logo.Bottom-h:logo.Top,w,h),work);}
  static Rectangle Fit(Rectangle r,Rectangle work){r.Width=Math.Min(r.Width,work.Width);r.Height=Math.Min(r.Height,work.Height);r.X=Math.Max(work.Left,Math.Min(r.X,work.Right-r.Width));r.Y=Math.Max(work.Top,Math.Min(r.Y,work.Bottom-r.Height));return r;}
 }
}
