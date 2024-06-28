<script lang="ts">
  import * as fflate from 'fflate';
  import { _ } from 'svelte-i18n';
  import { createEventDispatcher, onDestroy } from 'svelte';
	import { forceDownload } from '$lib/helpers';
  import { exportResponses } from '$lib/exporter';
  import { ResponseStream } from '$lib/responseStream';
	import { formatBytes } from '$lib/format';
	import DownloadIcon from '$lib/components/icons/Download.svelte';
	import RadioInput from '$lib/components/blocks/RadioInput.svelte';
	import ToggleInput from '$lib/components/blocks/ToggleInput.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import type { IFile, IForm, IResponse, TResponseData } from '$lib/types';

  export let form: IForm;
  export let singleResponse: boolean = false;
  export let responseIds: string[] | null = null;

  const dispatch = createEventDispatcher();
  const formats = [
    'pdf',
    'csv',
    'json',
  ] as const;

  let downloadingFile: { bytesLoaded: number; bytesTotal: number; file: IFile } | null = null;
  let errors: [string, string][] = [];
  let exporting: boolean = false;
  let exportedCount: number = 0;
  let includeAttachments: boolean = false;
  let individual: boolean = false;
  let selectedFormat: typeof formats[number] = 'pdf';
  let stream: ResponseStream | null = null;
  let totalCount: number = 0;
  let zipSize: number = 0;

  $: progress = totalCount ? exportedCount / totalCount : 0;

  onDestroy(() => {
    if (stream) {
      stream.controller.abort();
    }
  });

  function reset() {
    errors = [];
    exportedCount = 0;
    totalCount = 0;
    zipSize = 0;
  }

  export async function generateZip(exportIndividual: boolean = individual) {
    let zipBuf = new Uint8Array();
    let bulkResponses: { data: TResponseData; files?: any[]; response: IResponse }[] = [];
    exporting = true;
    reset();
    try {
      const zip = new fflate.Zip((err, chunk, final) => {
        if (!err) {
          zipBuf = new Uint8Array([...zipBuf, ...chunk]);
          zipSize = zipBuf.length;
          if (final) {
            forceDownload(zipBuf.buffer, `export_${form.id}.zip`, 'application/zip');
            if (!errors.length) {
              requestAnimationFrame(() => {
                dispatch('finish');
              });
            }
          }
        }
      });
      stream = new ResponseStream({
        accountId: form.accountId,
        files: includeAttachments,
        formId: form.id,
        responseIds: responseIds ?? void 0,
        onFile(response, file, contents) {
          const f = new fflate.ZipDeflate(`attachments/${response.id}/${file.name}`);
          zip.add(f);
          f.push(new Uint8Array(contents), true);
          downloadingFile = null;
        },
        onFileProgress(_, file, bytesLoaded, bytesTotal) {
          downloadingFile = {
            bytesLoaded,
            bytesTotal,
            file,
          };
        },
        onRequest(offset, result) {
          if (offset === 0 && result) {
            totalCount = result.total;
          }
        },
        async onResponse(response, data, error) {
          if (data && !error) {
            if (exportIndividual) {
              const files = exportResponses(form, [{ data, response }], selectedFormat, {
                individual: true,
              });
              for (const { contents, name } of files) {
                const file = new fflate.ZipDeflate(name);
                zip.add(file);
                file.push(new Uint8Array(contents), true);
              }
            } else {
              bulkResponses.push({
                data,
                response,
              });
            }
          } else {
            errors = [...errors, [ response.id, error || 'Unable to retrieve data.']];
          }
          exportedCount += 1;
        },
      });
      await stream.stream();
      if (stream.controller.signal.aborted) {
        zip.terminate();
      } else {
        if (bulkResponses.length) {
          const files = exportResponses(form, bulkResponses, selectedFormat);
          for (const { contents, name } of files) {
            const file = new fflate.ZipDeflate(name);
            zip.add(file);
            file.push(new Uint8Array(contents), true);
          }
        }
        if (errors.length) {
          const file = new fflate.ZipDeflate('errors.csv');
          zip.add(file);
          file.push(new TextEncoder().encode([['id', 'error'].join(';'), ...errors.map((row) => row.join(';'))].join('\n')), true);
        }
        zip.end();
      }
    } finally {
      exporting = false;
    }
  }

</script>

<div class="flex flex-col gap-6">
  {#if !singleResponse}
  <div>
    <div class="text-lg truncate font-bold">{form.name}</div>
    <div class="opacity-60 text-sm">{form.id}</div>
  </div>

  <div>
    <MarkdownRenderer
      value={responseIds === null ? $_('text.export_all_responses') : $_('text.export_x_responses', { values: { count: responseIds.length }})}
    />
  </div>
  {/if}

  {#if totalCount}
  <div class="flex flex-col gap-2 border border-base-300 p-3 rounded-md">
    <div>
      <progress class="progress progress-primary w-full" value={progress} max="1"></progress>
    </div>

    {#if downloadingFile}
    {@const fileProgress = downloadingFile.bytesLoaded && downloadingFile.bytesTotal ? downloadingFile.bytesLoaded / downloadingFile.bytesTotal : 0}
    <div>
      <div class="flex gap-3 text-sm">
        <div class="grow">
          <span class="truncate">{$_('text.downloading_file_name', { values: { name: downloadingFile.file.name } })}</span>
        </div>
        <div class="opacity-60">
          {formatBytes(downloadingFile.bytesLoaded)} / {formatBytes(downloadingFile.bytesTotal)}
        </div>
      </div>

      <div>
        <progress class="progress progress-secondary w-full" value={fileProgress} max="1"></progress>
      </div>
    </div>
    {/if}

    <div class="flex gap-3 text-sm opacity-60">
      <div class="grow">
        {#if !singleResponse}
        {$_('text.x_out_of', { values: { of: totalCount, x: exportedCount } })}
        {/if}
      </div>

      {#if zipSize}
      <div>
        {formatBytes(zipSize)}
      </div>
      {/if}
    </div>
  </div>
  {/if}

  {#if errors.length}
  <div>
    <Alert variant="warning">
      {$_('text.export_x_errors', { values: { x: errors.length } })}
    </Alert>
  </div>
  {/if}

  <div>
    <RadioInput
      block={{
        label: $_('label.export_format'),
        name: '',
        options: {
          inline: true,
          options: [{
            label: 'PDF',
            value: 'pdf',
          }, {
            label: 'CSV',
            value: 'csv',
          }, {
            label: 'JSON',
            value: 'json',
          }],
        },
      }}
      disabled={exporting}
      bind:value={selectedFormat}
    />
  </div>

  <div class="flex flex-col gap-4">
    {#if !singleResponse}
    <ToggleInput
      block={{
        help: $_('help.export_individual_files'),
        label: $_('label.export_individual_files'),
        name: '',
      }} 
      disabled={selectedFormat === 'pdf'}
      bind:value={individual}
    />
    {/if}

    <ToggleInput
      block={{
        help: $_('help.export_include_attachments'),
        label: $_('label.export_include_attachments'),
        name: '',
      }} 
      bind:value={includeAttachments}
    />
  </div>

  <div>
    <button
      type="button"
      class="grow gap-3 btn btn-primary btn-wide"
      disabled={exporting}
      on:click|preventDefault={() => generateZip()}
    >
      {#if exporting}
      <span class="loading loading-spinner loading-xs"></span>
      {:else}
        <DownloadIcon class="w-4 h-4" />
        <div class="text-lg">{$_('button.download')}</div>
      {/if}
    </button>
  </div>

</div>