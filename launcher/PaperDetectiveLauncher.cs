using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class PaperDetectiveLauncher
{
    [STAThread]
    private static void Main()
    {
        var exeDirectory = AppDomain.CurrentDomain.BaseDirectory;
        var scriptPath = Path.Combine(exeDirectory, "start-local.ps1");

        if (!File.Exists(scriptPath))
        {
            MessageBox.Show(
                string.Format("start-local.ps1 was not found next to the launcher.\nExpected path:\n{0}", scriptPath),
                "Paper Detective Launcher",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            return;
        }

        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = string.Format("-ExecutionPolicy Bypass -File \"{0}\"", scriptPath),
                WorkingDirectory = exeDirectory,
                UseShellExecute = true,
            };

            Process.Start(startInfo);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                string.Format("Failed to start Paper Detective.\n\n{0}", ex.Message),
                "Paper Detective Launcher",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }
}
