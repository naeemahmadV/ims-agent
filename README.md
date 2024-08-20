
**Automatically track applications usage and working time.**

> With IMS Agent you can go back in time and see what you were working on. You can get information on what apps were used - exactly at what time - and what title the application had at that moment. This is enough to determine how much you did something.

**Track how you spent your time on a computer.**

> IMS Agent tracks active applications usage and computer state. It records active application titles. It tracks idle, offline, and online state. You can see this data with a nice interactive timeline chart.

**Analyze your computer usage**

> See you total online time today, yesterday, or any other day. In monthly calendar views and with charts.

<br/>

<br/>


# Made with

-   [Electron](https://electron.atom.io/) with [Webpack](https://webpack.github.io/) and [Typescript](https://www.typescriptlang.org/)
-   [React](https://reactjs.org/)
-   [D3 v4](https://d3js.org/) and [Victory Chart](http://formidable.com/open-source/victory/docs/victory-chart/)
-   [Chakra UI](https://chakra-ui.com/)

## Logs

By default, IMS Agent writes logs to the following locations:

Linux: `~/.config/tockler/logs/main.log`

macOS: `~/Library/Logs/tockler/main.log`

Windows: `%USERPROFILE%\AppData\Roaming\tockler\logs\main.log`

## Development

### Quick Start

> Prerequisites: [Node](https://nodejs.org/), [Git](https://git-scm.com/).

```bash
git clone https://github.com/Maygo/tockler.git  # Download this project

npm install yarn -g     # install yarn or binary from https://yarnpkg.com
```

### Start application

Renderer and main process builds have been separated. It's easier to boilerplate this project and switch client framework.

#### React client (renderer)

```
cd client/
yarn install            # Install dependencies
yarn start
```

#### Electron (main)

```
cd electron/
yarn install            # Install dependencies
yarn start
```

Build scripts samples are in travis/appveyor files.

### Testing MAS build

In electron-builder.yml replace
type: development
provisioningProfile: development.provisionprofile

# Signing

https://4sysops.com/archives/sign-your-powershell-scripts-to-increase-security/'
in powershell as admin

```
$cert = Get-ChildItem -Path Cert:\CurrentUser\My -CodeSigningCert
Set-AuthenticodeSignature -FilePath '.\app\get-foreground-window-title.ps1' -Certificate $cert
```

# Snapcraft token

To generate SNAP_TOKEN run
`snapcraft export-login --snaps=tockler --acls=package_upload,channel --channels=stable -`
Copy output and Add SNAP_TOKEN to travis environment variables.
In travis we have:
`echo "$SNAP_TOKEN" | snapcraft login --with -`

# Errors

### while installing electron deps: electron-builder Error: Unresolved node modules: ref

Quick fix: ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true yarn

