import { docsYml } from "@fern-api/configuration";
import { AbsoluteFilePath, moveFolder } from "@fern-api/fs-utils";
import { rm, writeFile } from "fs/promises";
import yaml from "js-yaml";
import { getAbsolutePathToDocsFolder, getAbsolutePathToDocsYaml, loadRawDocsConfiguration } from "./docs-config";
import { convertLegacyDocsConfig } from "./docs-config/convertLegacyDocsConfig";
import { getAbsolutePathToGeneratorsConfiguration, loadRawGeneratorsConfiguration } from "./generators-configuration";
import { convertLegacyGeneratorsConfiguration } from "./generators-configuration/convertLegacyGeneratorsConfiguration";

/**
 * fern/  <------ path to fern directory
 *   api/ <------ path to workspace
 *    definition/...
 *    generatiors.yml
 *    docs.yml
 *
 * This function migrates docs.yml and generators.yml to the new format, and then moves
 * everything in the workspace directory up one level.
 */
export async function migrateDocsAndSingleAPI({
    absolutePathToFernDirectory,
    absolutePathToWorkspace
}: {
    absolutePathToFernDirectory: AbsoluteFilePath;
    absolutePathToWorkspace: AbsoluteFilePath;
}): Promise<void> {
    const docsURLs = await migrateAndWriteGeneratorsYml({ absolutePathToWorkspace });
    await migrateAndWriteDocsYml({ absolutePathToWorkspace, docsURLs });

    const absolutePathToDocsFolder = getAbsolutePathToDocsFolder({ absolutePathToWorkspace });
    await moveFolder({ src: absolutePathToDocsFolder, dest: absolutePathToFernDirectory });
    await moveFolder({ src: absolutePathToWorkspace, dest: absolutePathToFernDirectory });

    await rm(absolutePathToDocsFolder, { recursive: true });
    await rm(absolutePathToWorkspace, { recursive: true });
}

async function migrateAndWriteDocsYml({
    absolutePathToWorkspace,
    docsURLs
}: {
    absolutePathToWorkspace: AbsoluteFilePath;
    docsURLs: docsYml.RawSchemas.DocsInstances[];
}): Promise<void> {
    const docsConfiguration = await loadRawDocsConfiguration({ absolutePathToWorkspace });
    if (docsConfiguration == null) {
        return;
    }
    const convertedDocsConfig = convertLegacyDocsConfig({
        docsConfiguration,
        docsURLs,
        apiName: undefined
    });
    const absolutePathToDocsConfig = getAbsolutePathToDocsYaml({ absolutePathToWorkspace });
    await writeFile(absolutePathToDocsConfig, yaml.dump(convertedDocsConfig));
}

async function migrateAndWriteGeneratorsYml({
    absolutePathToWorkspace
}: {
    absolutePathToWorkspace: AbsoluteFilePath;
}): Promise<docsYml.RawSchemas.DocsInstances[]> {
    const generatorsConfiguration = await loadRawGeneratorsConfiguration({ absolutePathToWorkspace });
    if (generatorsConfiguration == null) {
        return [];
    }
    const absolutePathToGeneratorsConfiguration = getAbsolutePathToGeneratorsConfiguration({ absolutePathToWorkspace });
    const convertedResponse = convertLegacyGeneratorsConfiguration({
        generatorsConfiguration,
        pathModificationStrategy: "MoveUp"
    });
    await writeFile(absolutePathToGeneratorsConfiguration, yaml.dump(convertedResponse.value));
    return convertedResponse.docsURLs;
}
