#!/bin/bash

tag='production'

print_usage() {
	echo 'build.sh [-h] [-n {prod|beta|desktop}]'
}

while getopts 'hn:' OPT; do
	case "${OPT}" in
		h)
			print_usage
			exit 0
			;;
		n)
			tag="${OPTARG}"
			;;
		*)
			print_usage >&2
			exit 1
			;;
	esac
done

case "${tag}" in
	prod|production)
		release_tag=''
    tag='production'
		;;
	beta|desktop)
		release_tag="-${tag}"
		;;
	*)
		echo "Invalid tag: ${tag}" >&2
		exit 1
		;;
esac

docker build --build-arg TAG="${tag}" -t qlcchain/qlcwallet${release_tag}:latest .
