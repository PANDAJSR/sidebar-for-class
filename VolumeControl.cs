using System;
using System.Runtime.InteropServices;

namespace VolumeControl
{
    class Program
    {
        [ComImport]
        [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
        private class MMDeviceEnumerator
        {
        }

        [ComImport]
        [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface IMMDeviceEnumerator
        {
            [PreserveSig]
            int EnumAudioEndpoints(int dataFlow, int dwStateMask, out object ppDevices);
            
            [PreserveSig]
            int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
        }

        [ComImport]
        [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface IMMDevice
        {
            [PreserveSig]
            int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
        }

        [ComImport]
        [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface IAudioEndpointVolume
        {
            [PreserveSig]
            int RegisterControlChangeNotify(IntPtr pNotify);
            [PreserveSig]
            int UnregisterControlChangeNotify(IntPtr pNotify);
            [PreserveSig]
            int GetChannelCount(out int pnChannelCount);
            [PreserveSig]
            int SetMasterVolumeLevel(float fLevelDB, IntPtr pguidEventContext);
            [PreserveSig]
            int SetMasterVolumeLevelScalar(float fLevel, IntPtr pguidEventContext);
            [PreserveSig]
            int GetMasterVolumeLevel(out float pfLevelDB);
            [PreserveSig]
            int GetMasterVolumeLevelScalar(out float pfLevel);
        }

        [STAThread]
        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                Console.WriteLine("Usage: VolumeControl.exe [get|set <0-100>]");
                return;
            }

            try
            {
                Type type = Type.GetTypeFromCLSID(new Guid("BCDE0395-E52F-467C-8E3D-C4579291692E"));
                if (type == null) {
                    Console.WriteLine("Error: MMDeviceEnumerator type not found.");
                    return;
                }
                object obj = Activator.CreateInstance(type);
                if (obj == null) {
                    Console.WriteLine("Error: Activator.CreateInstance returned null.");
                    return;
                }
                IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)obj;
                
                IMMDevice device;
                // eRender = 0, eMultimedia = 1
                enumerator.GetDefaultAudioEndpoint(0, 1, out device); 
                if (device == null) {
                    Console.WriteLine("Error: GetDefaultAudioEndpoint returned null.");
                    return;
                }

                object o;
                // CLSCTX_ALL = 23 (0x17)
                device.Activate(typeof(IAudioEndpointVolume).GUID, 23, IntPtr.Zero, out o);
                if (o == null) {
                    Console.WriteLine("Error: device.Activate returned null.");
                    return;
                }
                
                IAudioEndpointVolume volume = (IAudioEndpointVolume)o;

                if (args[0].ToLower() == "get")
                {
                    float currentVolume;
                    volume.GetMasterVolumeLevelScalar(out currentVolume);
                    Console.WriteLine((int)(currentVolume * 100));
                }
                else if (args[0].ToLower() == "set" && args.Length > 1)
                {
                    float newVolume;
                    if (float.TryParse(args[1], out newVolume))
                    {
                        newVolume = Math.Max(0, Math.Min(100, newVolume));
                        volume.SetMasterVolumeLevelScalar(newVolume / 100.0f, IntPtr.Zero);
                        Console.WriteLine("OK");
                    }
                    else
                    {
                        Console.WriteLine("Invalid volume value");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }
        }
    }
}
