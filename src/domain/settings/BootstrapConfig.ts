export type BootstrapMode = "sip-only" | "ocp";

export type AppBootstrapConfig = Readonly<{
  mode: BootstrapMode;
  ocpToken?: string;
  ocpDomain?: string;
}>;
