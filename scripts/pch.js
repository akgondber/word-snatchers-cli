import PostCommandHook from "post-command-hook";
import InstallPackagesPlugin from "post-command-hook-install-packages-plugin";

const postCommandHook = new PostCommandHook({
  command: "echo",
  args: ["Some stuff going to be executed..."],
});
postCommandHook.setRunOnce(true);
postCommandHook.use(
  new InstallPackagesPlugin(["purposefile"], { saveDev: true })
);
postCommandHook.use(new InstallPackagesPlugin(["expect"], { saveDev: true }));

(async () => {
  await postCommandHook.run();
})();
