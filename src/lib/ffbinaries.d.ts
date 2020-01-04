declare module "ffbinaries" {
  function downloadBinaries(
    options: { destination: string },
    callback: () => void
  );
}
